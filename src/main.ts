import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

// Obsidian 运行时需要一定时间完成初始化，等 DOM 和脚本就绪后挂载 Vue
function mount() {
  createApp(App).mount('#app');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 100));
} else {
  setTimeout(mount, 100);
}
