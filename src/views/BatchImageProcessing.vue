<template>
  <div class="container">
    <div class="section batch-image-section">
      <h3>批量图片处理</h3>
      <el-upload
        ref="batchUpload"
        action="#"
        list-type="picture-card"
        :auto-upload="false"
        :multiple="true"
        :limit="9"
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
        <el-button type="primary" @click="handleBatchUpload">开始处理</el-button>
      </div>
      <el-dialog :visible.sync="dialogVisible">
        <img width="100%" :src="dialogImageUrl" alt="">
      </el-dialog>

      <!-- 新增下载区域 -->
      <div class="download-section" v-if="showDownload">
        <el-button 
          type="success" 
          @click="handleDownload"
          icon="el-icon-download"
        >
          下载处理后的文件
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dialogImageUrl: '',
      dialogVisible: false,
      imageType: 'translator',
      compressImage: false,
      processing: false,
      downloadUrl: '',  // 新增下载地址
      showDownload: false  // 控制下载链接显示
    };
  },
  methods: {
    async handleBatchUpload() {
      const files = this.$refs.batchUpload.uploadFiles;
      if (files.length === 0) {
        this.$message.warning('请先选择图片');
        return;
      }
      
      this.processing = true;
      const loadingInstance = this.$loading({
        lock: true,
        text: '批量处理中...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
  
      try {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('images', file.raw);
        });
        formData.append('imageType', this.imageType);
        formData.append('compressImage', this.compressImage);
  
        const response = await this.$http.post('/picture/upload-batch-images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 360000 // 超时时间设置为120秒
        });
        console.log(response)
        if (response.success) {
          console.log(response.downloadUrl)
          this.downloadUrl = response.downloadUrl;
          this.showDownload = true;
          this.$message.success('处理完成，请点击下载链接获取文件');
        }
      } catch (error) {
        console.error('批量处理失败:', error);
        this.$message.error('图片处理失败');
      } finally {
        loadingInstance.close();
        this.processing = false;
      }
    },
    handleRemove(file) {
      const upload = this.$refs.batchUpload;
      upload.uploadFiles = upload.uploadFiles.filter(f => f.uid !== file.uid);
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    
    // 新增下载方法
    handleDownload() {
      const baseUrl = this.$http.defaults.baseURL; // 从axios实例中获取baseURL
      window.location.href = baseUrl + this.downloadUrl;
    }
  }
}
</script>

<style scoped>
.batch-image-section {
  padding: 20px;
}

.upload-controls {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.el-upload-list--picture-card {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.el-upload-list--picture-card {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>

<style scoped>
/* 新增样式 */
.download-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}
</style>