# ollama-vue-demo

- 本地部署ollama来提供服务，使用vue3来渲染UI，实现简单的对话模式。整个项目非常简单，非常适合学习js请求流式数据及自动码字的交互实现。
  
## 基本介绍

- 使用了ollama的`http://localhost:11434/api/chat`提供服务，流式返回数据
  
- 使用`vue3+tdesign` 来完成页面的渲染和布局。
  
-  默认使用的model是`llama3.2:latest`，可以更加需要自己更换为`deepseek-r1:1.5b`或`qwen`等。
  
  
```JavaScript
  body: JSON.stringify({
      messages, // 消息列表
      model: 'llama3.2:latest', // 模型
      stream: true, // 流式
    }),
 ```


## 项目运行

```bash
# Install
npm i 
npm run dev

```