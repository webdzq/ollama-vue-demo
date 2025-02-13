<template>
  <t-chat
    ref="chatRef"
    layout="single"
    style="height: 600px"
    :clear-history="chatList.length > 0 && !isStreamLoad"
    @clear="clearConfirm"
  >
    <template v-for="(item, index) in chatList" :key="index">
      <t-chat-item
        :avatar="item.avatar"
        :name="item.name"
        :role="item.role"
        :datetime="item.datetime"
        :content="item.content"
        :text-loading="index === 0 && loading"
      >
        <template v-if="!isStreamLoad" #actions>
          <t-chat-action
            :is-good="isGood"
            :is-bad="isBad"
            :content="item.content"
            @operation="(type, { e }) => handleOperation(type, { e, index })"
          />
        </template>
      </t-chat-item>
    </template>
    <template #footer>
      <t-chat-input :stop-disabled="isStreamLoad" @send="inputEnter" @stop="onStop"> </t-chat-input>
    </template>
  </t-chat>
</template>
<script setup>
import { ref } from 'vue';

const fetchCancel = ref(null);
const loading = ref(false);
const isStreamLoad = ref(false);
const isGood = ref(false);
const isBad = ref(false);
const chatRef = ref(null);
// 滚动到底部
const backBottom = () => {
  chatRef.value.scrollToBottom({
    behavior: 'smooth',
  });
};
// 倒序渲染
const chatList = ref([
  {
    content: `模型由 ollama 提供数据支持`,
    role: 'model-change',
  },
  {
    avatar: 'https://img2.woyaogexing.com/2019/08/01/74027df1d34a44eda427488671f0b6cc%21400x400.jpeg',
    name: 'Ollama',
    datetime: '今天13:14',
    content: '元宵节是中国传统的节日之一，通常在农历正月十五至十六之间举行。这个节日有着丰富的文化和历史背景',
    role: 'assistant',
  },
  {
    avatar: 'https://12500332.s21i.faiusr.com/2/ABUIABACGAAgr9-Z6gUowPzSYTDcCzipBw.jpg',
    name: '自己',
    datetime: '今天13:14',
    content: '元宵节',
    role: 'user',
  },
]);
const clearConfirm = function () {
  chatList.value = [];
};
const onStop = function () {
  if (fetchCancel.value) {
    fetchCancel.value.abort();
    loading.value = false;
    isStreamLoad.value = false;
  }
};
const handleOperation = function (type, options) {
  const { index } = options;
  if (type === 'good') {
    isGood.value = !isGood.value;
    isBad.value = false;
  } else if (type === 'bad') {
    isBad.value = !isBad.value;
    isGood.value = false;
  } else if (type === 'replay') {
    const userQuery = chatList.value[index + 1].content;
    inputEnter(userQuery);
  }
};
const handleData = async (inputValue) => {
  loading.value = true;
  isStreamLoad.value = true;
  const lastItem = chatList.value[0];
  const messages = [{
    role: 'user',
    content: inputValue,
  }];
  fetchSSE(messages, {
      success(result) {
        console.log('res=',result)
        loading.value = false;
        const { data } = result;
        lastItem.content += data;
        console.log('lastItem.content',lastItem.content)
      },
      complete(isOk, msg) {
        if (!isOk || !lastItem.content) {
          lastItem.role = 'error';
          lastItem.content = msg;
        }
        // 控制终止按钮
        isStreamLoad.value = false;
        loading.value = false;
      },
      cancel(cancel) {
      fetchCancel.value = cancel;
    },
    });
};
const inputEnter = function (inputValue) {
  if (isStreamLoad.value) {
    return;
  }
  if (!inputValue) return;
  const params = {
    avatar: 'https://12500332.s21i.faiusr.com/2/ABUIABACGAAgr9-Z6gUowPzSYTDcCzipBw.jpg',
    name: '自己',
    datetime: new Date().toDateString(),
    content: inputValue,
    role: 'user',
  };
  chatList.value.unshift(params);
  // 空消息占位
  const params2 = {
    avatar: 'https://img2.woyaogexing.com/2019/08/01/74027df1d34a44eda427488671f0b6cc%21400x400.jpeg',
    name: 'Ollama',
    datetime: new Date().toDateString(),
    content: '',
    role: 'assistant',
  };
  chatList.value.unshift(params2);
  handleData(inputValue);
};
// 解析SSE数据
const fetchSSE = async (messages, options) => {
  const { success, fail, complete, cancel } = options;
  const controller = new AbortController();
  const { signal } = controller;
  cancel?.(controller);
  
  // 请求成功
  const resPromise = fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // "Content-Type": "text/event-stream"
      // Authorization: `Bearer${apiKey ? ` ${apiKey}` : ''}`,
    },
    body: JSON.stringify({
      messages, // 消息列表
      model: 'llama3.2:latest', // 模型
      stream: true, // 流式
    }),
    signal,
  }).catch((e) => {
    const msg = e.toString() || '流式接口异常';
    complete?.(false, msg);
    return Promise.reject(e); // 确保错误能够被后续的.catch()捕获
  });
   resPromise.then(
    async (response)=>{
      console.log('response',response)
      if (!response.ok) {
            complete?.(false, response.statusText);
            fail?.();
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const event = { type: null, data: null };
        while (true) {
            const { done, value } = await reader.read();
            console.log('done',done)
            if (done) {
                complete?.(true);
                return Promise.resolve();
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            console.log('lines',lines)
            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const chunk = JSON.parse(line);
                    console.log('chunk',chunk)
                    if (chunk.done) {
                        event.type='finish'
                        event.data='';
                        break;
                    }
                    if (chunk.message&&chunk.message?.content) {
                        console.log('chunk.response',chunk.message?.content);
                        event.type='delta'
                        event.data=chunk.message?.content;
                        if (event.type && event.data) {
                          const jsonData = JSON.parse(JSON.stringify(event));
                          // debugger;
                          success(jsonData);
                        }
                    }

                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            }

        } 
    }
   ).catch(() => {
      // 处理整个链式调用过程中发生的任何错误
      fail?.();
    });
};



</script>
<style lang="less" scoped></style>

