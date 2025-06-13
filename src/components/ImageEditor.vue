<template>
  <div class="image-editor">
    <button @click="rotateImage">旋转</button>
    <button @click="flipImage('horizontal')">水平翻转</button>
    <button @click="flipImage('vertical')">垂直翻转</button>
    <button @click="undo">撤销</button>
    <button @click="redo">重做</button>
    <button @click="startCutting">抠图</button>
    <canvas 
      ref="editorCanvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    ></canvas>
  </div>
</template>

<script>
export default {
  props: {
    editorImageData: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      canvas: null,
      ctx: null,
      image: null,
      history: [],
      historyIndex: -1,
      isCutting: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0
    };
  },
  mounted() {
    this.initCanvas();
  },
  methods: {
    initCanvas() {
      try {
        this.canvas = this.$refs.editorCanvas;
        if (!this.canvas) {
          throw new Error('Canvas元素未找到');
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
          throw new Error('无法获取2D上下文');
        }
        
        // 创建新的Image对象并存储到组件数据中
        this.image = new Image();
        this.image.src = this.editorImageData;
        
        // 确保图片加载完成后再绘制
        this.image.onload = () => {
          this.canvas.width = this.image.width;
          this.canvas.height = this.image.height;
          this.ctx.drawImage(this.image, 0, 0);
          this.saveState(); // 保存初始状态
        };
        
        this.image.onerror = (err) => {
          console.error('图片加载失败:', err);
          this.$emit('error', '图片加载失败');
        };
      } catch (error) {
        console.error('Canvas初始化错误:', error);
        this.$emit('error', '编辑器初始化失败');
      }
    },
    getActiveObject() {
      if (!this.canvas) {
        console.warn('Canvas未初始化');
        return null;
      }
      
      try {
        // 假设使用Fabric.js
        return this.canvas.getActiveObject();
      } catch (error) {
        console.error('获取活动对象失败:', error);
        return null;
      }
    },
    
    saveState() {
      // 保存当前Canvas状态
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(imageData);
      this.historyIndex++;
    },
    
    restoreState() {
      // 恢复Canvas状态
      if (this.historyIndex >= 0) {
        const imageData = this.history[this.historyIndex];
        this.ctx.putImageData(imageData, 0, 0);
      }
    },
    
    rotateImage() {
      this.saveState();
      
      // 旋转90度
      const canvas = document.createElement('canvas');
      canvas.width = this.canvas.height;
      canvas.height = this.canvas.width;
      const ctx = canvas.getContext('2d');
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);
      
      this.canvas.width = canvas.width;
      this.canvas.height = canvas.height;
      this.ctx.drawImage(canvas, 0, 0);
    },
    
    flipImage(direction) {
      this.saveState();
      
      const canvas = document.createElement('canvas');
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
      const ctx = canvas.getContext('2d');
      
      if (direction === 'horizontal') {
        ctx.translate(this.canvas.width, 0);
        ctx.scale(-1, 1);
      } else if (direction === 'vertical') {
        ctx.translate(0, this.canvas.height);
        ctx.scale(1, -1);
      }
      
      ctx.drawImage(this.canvas, 0, 0);
      this.ctx.drawImage(canvas, 0, 0);
    },
    
    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.restoreState();
      }
    },
    
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.restoreState();
      }
    },
    
    startCutting() {
      this.isCutting = true;
      this.canvas.style.cursor = 'crosshair';
    },
    
    handleMouseDown(event) {
      if (this.isCutting) {
        const rect = this.canvas.getBoundingClientRect();
        this.startX = event.clientX - rect.left;
        this.startY = event.clientY - rect.top;
      }
    },
    
    handleMouseMove(event) {
      if (this.isCutting) {
        const rect = this.canvas.getBoundingClientRect();
        this.endX = event.clientX - rect.left;
        this.endY = event.clientY - rect.top;
        this.drawSelectionRect();
      }
    },
    
    handleMouseUp() {
      if (this.isCutting) {
        this.cutImage();
        this.isCutting = false;
        this.canvas.style.cursor = 'default';
      }
    },
    
    // 修改drawSelectionRect方法
    drawSelectionRect() {
      if (!this.image) return;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image, 0, 0);
      
      if (this.isCutting) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
          this.startX,
          this.startY,
          this.endX - this.startX,
          this.endY - this.startY
        );
      }
    },
    
    // 修改cutImage方法
    cutImage() {
      if (!this.image) return;
      
      this.saveState();
      
      const width = this.endX - this.startX;
      const height = this.endY - this.startY;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      tempCtx.drawImage(
        this.image,  // 使用存储的image对象
        this.startX,
        this.startY,
        width,
        height,
        0,
        0,
        width,
        height
      );
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(tempCanvas, 0, 0);
    }
  }
}
</script>

<style scoped>
.image-editor {
  width: 100%;
  height: 100%;
}

canvas {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
}
</style>