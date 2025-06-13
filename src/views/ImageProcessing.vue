<template>
  <div class="container">  <!-- 添加container类 -->
    <div class="section image-section">
      <h3>单张图片处理</h3>
      <el-upload
        ref="upload"
        action="#"
        list-type="picture-card"
        :auto-upload="false"
        :limit="1"
        >
          <i slot="default" class="el-icon-plus"></i>
          <div slot="file" slot-scope="{file}">
            <img
              class="el-upload-list__item-thumbnail"
              :src="file.url" alt=""
            >
            <span class="el-upload-list__item-actions">
              <span
                class="el-upload-list__item-preview"
                @click="handlePictureCardPreview(file)"
              >
                <i class="el-icon-zoom-in"></i>
              </span>              
              <span
                v-if="!disabled"
                class="el-upload-list__item-delete"
                @click="handleRemove(file)"
              >
                <i class="el-icon-delete"></i>
              </span>
            </span>
          </div>
      </el-upload>
      <div class="upload-controls">
        <el-radio v-model="imageType" label="translator">图片翻译</el-radio>
        <el-radio v-model="imageType" label="pick">抠图</el-radio>
        <el-checkbox v-model="compressImage">扩图(1600*1600)</el-checkbox>
        <el-button type="primary" @click="handleUpload">上传图片</el-button>
      </div>
      <el-dialog :visible.sync="dialogVisible">
        <img width="100%" :src="dialogImageUrl" alt="">
      </el-dialog>
      
      <!-- 新增图片预览区域 -->
       
      <div class="preview-section" v-if="resultPreview">
        <h3>处理结果预览</h3>
        <div class="preview-images">
          <el-image
            :src="resultUrl"
            :preview-src-list="[resultUrl]"
            fit="contain"
            class="preview-image"
          >
            <div slot="error" class="image-error">
              <i class="el-icon-picture-outline"></i>
              <span>图片加载失败</span>
            </div>
          </el-image>
          <el-button 
            type="primary" 
            @click="openEditor"
            style="margin-left: 20px;"
          >
            编辑图片
          </el-button>
        </div>
        <!-- 将编辑器对话框移到预览区域下方 -->
        <el-dialog 
          :visible.sync="editorVisible" 
          title="图片编辑器" 
          width="80%"
          :append-to-body="true"
        >
          <ImageEditor 
            :editorImageData="editorImageData" 
            @error="handleEditorError"
            @completed="onEditorCompleted"
          />
        </el-dialog>
      </div>
        <!-- 删除图片编辑器对话框 -->
      </div>
    <el-dialog
      :visible.sync="iframeVisible"
      title="Iframe 图片编辑器"
      width="90%"
      :append-to-body="true"
    >
      <iframe
        ref="imageIframe"
        :src="iframeSrc"
        width="100%"
        height="600px"
        frameborder="0"
        @load="onIframeLoad"
      ></iframe>
      <el-button @click="saveEditImg">保存</el-button>
    </el-dialog>
  </div>

</template>

<script>
import ImageEditor from '@/components/ImageEditor'  // 导入新的图片编辑器组件

export default {
  components: {
    ImageEditor  // 注册组件
  },
  data() {
    return {
      dialogImageUrl: '',
      dialogVisible: false,
      disabled: false,
      imageType: 'translator',  // 图片处理类型，默认图片翻译
      compressImage: false,
      resultPreview: false,
      resultUrl: '#',
      editorVisible: false,  // 控制编辑器对话框显示
      editorImageData: '', // 存储base64图片数据
      base64: '',
      iframeVisible: true, // 控制 iframe 对话框显示
      // iframeSrc: 'http://192.168.0.105:8081/' // iframe 的源，初始为空白页
      iframeSrc: 'http://localhost:8081/' // iframe 的源，初始为空白页
    };
  },
  methods: {
    saveEditImg(){
      
    },
    async handleUpload() {
      const files = this.$refs.upload.uploadFiles;
      if (files.length === 0) {
        this.$message.warning('请先选择图片');
        return;
      }
      
      // 显示加载遮罩
      const loadingInstance = this.$loading({
        lock: true,
        text: '图片处理中...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
  
      try {
        // 将图片转换为base64
        const file = files[0].raw;
        // const base64 = await this.fileToBase64(file);
        // 上传处理
        const formData = new FormData();
        formData.append('images', file);
        formData.append('imageType', this.imageType);
        formData.append('compressImage', this.compressImage);
  
        const response = await this.$http.post('/picture/upload-single-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000
        });
        console.log('上传成功:', response);
        if (response.length > 0) {
          this.resultPreview = true;
          this.resultUrl = response[0];
          console.log('处理后的图片URL:', this.resultUrl);
          this.editorImageData = await this.fileToBase64(this.resultUrl); // 等待 Promise 完成
          this.$message.success('图片处理成功');
        }
      } catch (error) {
        console.error('上传失败:', error);
        this.$message.error('图片处理失败');
      } finally {
        loadingInstance.close();
      }
    },
    async fileToBase64(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // 允许跨域
        img.src = url;
  
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
  
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
  
          const base64 = canvas.toDataURL('image/png'); // 转换为 Base64
          resolve(base64);
        };
  
        img.onerror = (error) => {
          reject(error);
        };
      });
    },
    openEditor() {
      // 直接使用已保存的base64数据
      this.editorVisible = true;
    },
    openIframeEditor() {
      this.iframeVisible = true;
      // 设置 iframe 的 src，这里可以是一个本地 HTML 文件或者一个外部 URL
      // 例如：this.iframeSrc = '/static/iframe-editor.html';
      // 为了演示 postMessage，我们先设置为 about:blank，然后在 load 事件中发送数据
      this.iframeSrc = 'about:blank'; 
    },
    onIframeLoad() {
      // 当 iframe 加载完成后，通过 postMessage 发送数据
      if (this.$refs.imageIframe && this.$refs.imageIframe.contentWindow) {
        this.$refs.imageIframe.contentWindow.postMessage(
          { type: 'imageData', data: this.editorImageData },
          '*' // 目标源，'*' 表示任何源，实际应用中应指定具体源以提高安全性
        );
        console.log('Image data sent to iframe via postMessage');
      }
    },
    handleRemove(file) {
      const upload = this.$refs.upload;
      upload.uploadFiles.forEach(f => {
        if (f.uid === file.uid) {
          upload.uploadFiles.splice(upload.uploadFiles.indexOf(f), 1);
        }
      })
      console.log(this.uploadFiles)
      this.dialogImageUrl = '';  // 清空预览图片
      this.dialogVisible = false;  // 关闭预览对话框
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    handlePreview(image) {
      this.dialogImageUrl = image;
      this.dialogVisible = true;
    },
    onCompleted(data) {
      console.log('Picture editor completed:', data);
    },
    openEditor() {
      this.editorImageUrl = this.resultUrl;
      this.editorVisible = true;
    },
    
    onEditorCompleted(editedImageUrl) {
      this.editorVisible = false;
      if (editedImageUrl) {
        this.resultUrl = editedImageUrl;
        this.$message.success('图片编辑成功');
      }
    },
    handleEditorError(message) {
      this.$message.error(message);
      this.editorVisible = false;
    }
  }  
}

</script>

<style scoped>
.container {
  padding-left: 20px; /* 调整与导航栏的距离 */
  padding-right: 20px;
  padding-top: 20px;
}
.upload-controls {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
/* 新增样式 */
.preview-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.preview-images {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}
.preview-image {
  max-width: 150px;
  max-height: 150px;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: transform 0.2s;
}

.preview-image:hover {
  transform: scale(1.05);
}
</style>