<template>
  <div id="app">
    <nav>
      <router-link to="/image-processing">单张图片处理</router-link>
      <router-link to="/batch-image-processing">批量图片处理</router-link>
      <router-link to="/text-processing">文本处理</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: Arial, sans-serif;
  display: flex;
  height: 100vh;
}

nav {
  width: 200px;
  padding: 20px;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

nav a {
  padding: 10px;
  text-decoration: none;
  color: #2c3e50;
  border-radius: 4px;
}

nav a.router-link-exact-active {
  background: #4caf50;
  color: white;
}
</style>