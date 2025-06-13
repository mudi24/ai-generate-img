<template>
  <div class="section text-section">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-input
          type="textarea"
          :rows="20" 
          v-model="userInput"
          maxlength="2000" 
          placeholder="用户输入（最多2000字）"
          style="overflow-y: auto;"
        ></el-input>
        <div class="button-container" style="justify-content: space-between;">  <!-- 调整 justify-content -->
          <el-button type="danger" @click="clearAll">清空</el-button>
          <el-button type="primary" @click="handleImitate">仿写</el-button>
        </div>
      </el-col>
      <el-col :span="8">
        <el-input
          type="textarea"
          :rows="15"
          v-model="modelOutput"
          maxlength="2000"
          placeholder="仿写结果"
        ></el-input>
        <div class="button-container" style="justify-content: flex-end;">
          <el-button 
            type="success" 
            @click="handleTranslate"
          >
            翻译
          </el-button>
        </div>
      </el-col>
      <el-col :span="8">
        <el-input
          type="textarea"
          :rows="15"
          v-model="japaneseOutput"
          maxlength="2000"
          readonly
          placeholder="日文翻译结果"
        ></el-input>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  data() {
    return {
      userInput: '',
      modelOutput: '',
      japaneseOutput: ''
    }
  },
  methods: {
    clearAll() {
      this.userInput = ''
      this.modelOutput = ''
      this.japaneseOutput = ''
    },
    async handleImitate() {
      if (!this.userInput.trim()) {
        alert('请输入内容！')
        return
      }
      
      try {
        const baseUrl = this.$http.defaults.baseURL
        const response = await fetch(`${baseUrl}/text/imitate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: this.userInput })  // 直接传递包含text字段的JSON对象
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        this.modelOutput = ''
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          this.modelOutput += decoder.decode(value);
        }
      } catch (error) {
        console.error('Error:', error);
        this.modelOutput = '仿写报错: ' + error.message;
      }
    },
    async handleTranslate() {
      if (!this.modelOutput.trim()) {
        alert('请先生成仿写内容！')
        return
      }
      const baseUrl = this.$http.defaults.baseURL
      try {
        const response = await fetch(`${baseUrl}/text/translator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: this.modelOutput })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        this.japaneseOutput = ''
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          this.japaneseOutput += decoder.decode(value);
        }
      } catch (error) {
        console.error('Error:', error);
        this.japaneseOutput = '翻译出错: ' + error.message;
      }
    }
  }
}
</script>

<style scoped>
.text-section {
  padding: 20px 20px 20px 40px; /* 调整 padding-left 为 40px */
  height: calc(100vh - 40px); /* 使容器占满整个页面高度 */
  width: 100%;
  max-width: 1400px; /* 将最大宽度增加到 1400px */
  margin: 0 20px; /* 将左右 margin 缩小到 20px */
}

.button-container {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  justify-content: flex-start;  /* 左侧按钮左对齐，右侧按钮右对齐 */
}

.el-input {
  margin-bottom: 15px;
}

.el-textarea__inner {
  font-family: inherit;
  height: 100%; /* 使文本框占满父容器高度 */
}
</style>