
  import { createApp } from 'vue';
  import TDesign from 'tdesign-vue-next';
  import TDesignChat from '@tdesign-vue-next/chat'; // 引入chat组件
  import Demo from './demo.vue';

  // 引入组件库全局样式资源
  import 'tdesign-vue-next/es/style/index.css';
  import './index.css';

  const app = createApp(Demo);

  app.use(TDesign).use(TDesignChat).mount('#app');
