import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',  // 指定源代码根目录
  server: {
    proxy: {
      '/upload': 'http://localhost:3000'
    }
  },
  build: {
    outDir: '../dist'  // 指定构建输出目录
  }
}); 