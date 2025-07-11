<template>
  <div class="container"> <!-- 添加container类 -->
    <div class="section image-section">
      <h3>单张图片处理</h3>
      <el-upload ref="upload" action="#" list-type="picture-card" :auto-upload="false" :limit="1">
        <i slot="default" class="el-icon-plus"></i>
        <div slot="file" slot-scope="{file}">
          <img class="el-upload-list__item-thumbnail" :src="file.url" alt="">
          <span class="el-upload-list__item-actions">
            <span class="el-upload-list__item-preview" @click="handlePictureCardPreview(file)">
              <i class="el-icon-zoom-in"></i>
            </span>
            <span v-if="!disabled" class="el-upload-list__item-delete" @click="handleRemove(file)">
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
          <el-image :src="resultUrl" :preview-src-list="[resultUrl]" fit="contain" class="preview-image">
            <div slot="error" class="image-error">
              <i class="el-icon-picture-outline"></i>
              <span>图片加载失败</span>
            </div>
          </el-image>
          <el-button type="primary" @click="openEditor" style="margin-left: 20px;">
            编辑图片
          </el-button>
        </div>
        <!-- 将编辑器对话框移到预览区域下方 -->
        <el-dialog :visible.sync="editorVisible" title="图片编辑器" width="80%" :append-to-body="true">
          <ImageEditor :editorImageData="editorImageData" @error="handleEditorError" @completed="onEditorCompleted" />
        </el-dialog>
      </div>
      <!-- 删除图片编辑器对话框 -->
    </div>
    <el-dialog :visible="iframeVisible" title="Iframe 图片编辑器" width="90%" :append-to-body="true"
      :before-close="handleDialogClose">
      <iframe ref="imageIframe" :src="iframeSrc" width="100%" height="600px" frameborder="0"></iframe>
      <el-button @click="saveEditImg">保存</el-button>
    </el-dialog>
    <el-dialog :visible.sync="savePromptVisible" title="提示" width="30%" :before-close="handleSavePromptClose">
      <span>您编辑的图片还没有保存，是否要关闭？</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleSavePromptCancel">取消</el-button>
        <el-button type="primary" @click="handleSavePromptConfirm">保存并关闭</el-button>
      </span>
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
      iframeVisible: false, // 控制 iframe 对话框显示
      // iframeSrc: 'http://192.168.1.8:8080/',   // iframe 的源，初始为空白页
      iframeSrc: 'http://10.34.44.203:8080', // iframe 的源，初始为空白页
      savePromptVisible: false, // 新增：控制保存提示对话框的显示
    };
  },
  mounted() {
    window.addEventListener('message', this.handleIframeMessage);
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleIframeMessage);
  },
  methods: {
    handleDialogClose(done) {
      // 在这里执行关闭Dialog之前的操作
      console.log('Dialog is about to close');
      this.savePromptVisible = true; // 显示保存提示对话框
      // done 是一个必须被调用的函数，用于关闭 Dialog
      // 你可以传递一个布尔值给 done 来决定是否关闭 Dialog
      // done(false) 会阻止 Dialog 的关闭
      done(false);
    },
    // 处理编辑器对话框关闭事件
    handleEditorClose() {
      // 在这里检查是否有未保存的更改，并显示保存提示对话框
      if (this.hasUnsavedChanges) { // 假设你有一个方法来检查是否有未保存的更改
        this.savePromptVisible = true;
      }
    },

    // 处理保存提示对话框的关闭事件
    handleSavePromptClose(done) {
      // 这里不需要执行任何操作，因为我们会在用户点击按钮时处理关闭逻辑
      done();
    },

    // 处理取消按钮点击事件
    handleSavePromptCancel() {
      this.savePromptVisible = false; // 隐藏保存提示对话框
    },

    // 处理确认按钮点击事件
    handleSavePromptConfirm() {
      // 在这里执行保存操作，然后关闭编辑器对话框和保存提示对话框
      this.saveEditImg(); // 假设你有一个方法来保存更改
      this.iframeVisible = false;
      this.savePromptVisible = false;
    },
    handleIframeMessage(event) {
      console.log('Received image data from iframe:', event.data);
      // 检查消息来源以提高安全性
      if (event.origin !== this.iframeSrc) return;

      if (event.data.type === 'saveImageData' && event.data.editData) {
        
        const imageData = event.data.editData;
        console.log('Received image data from iframe:', imageData);
        this.resultUrl = imageData; // 将接收到的base64数据赋值给resultUrl
        this.resultPreview = true; // 显示预览区域
        this.$message.success('图片编辑已保存');
        this.iframeVisible = false; // 关闭iframe对话框
        this.savePromptVisible = false; // 关闭保存提示对话框
      }
    },
    saveEditImg() {
      if (this.$refs.imageIframe && this.$refs.imageIframe.contentWindow) {
        console.log('saveEditImg:');

        this.$refs.imageIframe.contentWindow.postMessage(
          { type: 'saveImage' },
          this.iframeSrc // 目标源，'*' 表示任何源，实际应用中应指定具体源以提高安全性
        );
      }
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
      this.openEditor()
      try {
        // 将图片转换为base64
        const file = files[0].raw;
        this.base64 = await this.fileToBase64(file); // 将本地文件转换为base64并存储
        this.editorImageData = this.base64; // 将base64数据赋值给editorImageData
        setTimeout(() => {
          if (this.$refs.imageIframe && this.$refs.imageIframe.contentWindow) {
            console.log('editorImageData:', this.editorImageData);

            this.$refs.imageIframe.contentWindow.postMessage(
              { type: 'imageData', data: this.editorImageData },
              this.iframeSrc // 目标源，'*' 表示任何源，实际应用中应指定具体源以提高安全性
            );
            console.log('Image data sent to iframe via postMessage');
          }
        }, 1000)

        return
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
          this.editorImageData = await this.fileToBase64(this.resultUrl); // 这行不再需要，因为我们已经有了本地图片的base64
          this.$message.success('图片处理成功');
        }
      } catch (error) {
        console.error('上传失败:', error);
        this.$message.error('图片处理失败');
      } finally {
        loadingInstance.close();
      }
    },
    async fileToBase64(file) {
      return new Promise((resolve, reject) => {
        // 如果传入的是 File 对象
        if (file instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        } else if (typeof file === 'string') { // 如果传入的是 URL 字符串
          const img = new Image();
          img.crossOrigin = 'Anonymous'; // 允许跨域
          img.src = file;

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
        } else {
          reject(new Error('Invalid input type. Expected File or URL string.'));
        }
      });
    },
    openEditor() {
      // 直接使用已保存的base64数据
      // this.editorVisible = true;
       this.openIframeEditor(); // 调用 openIframeEditor 方法
    },
    openIframeEditor() {
      this.iframeVisible = true;
    },
    onIframeLoad() {
      // 当 iframe 加载完成后，通过 postMessage 发送数据
      if (this.$refs.imageIframe && this.$refs.imageIframe.contentWindow) {
        console.log('editorImageData:', this.editorImageData);

        this.$refs.imageIframe.contentWindow.postMessage(
          { type: 'imageData', data: this.editorImageData },
          this.iframeSrc // // 目标源，'*' 表示任何源，实际应用中应指定具体源以提高安全性
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
  padding-left: 20px;
  /* 调整与导航栏的距离 */
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