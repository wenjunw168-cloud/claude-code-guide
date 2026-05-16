export const PROVIDERS = {
  anthropic: {
    name: 'Claude',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-6',
    format: 'anthropic',
    keyHint: 'Anthropic Key 格式为 <code>sk-ant-</code> 开头 · <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a> 创建',
  },
  openai: {
    name: 'ChatGPT',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    format: 'openai',
    keyHint: 'OpenAI Key 格式为 <code>sk-</code> 开头 · <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a> 创建',
  },
  kimi: {
    name: 'Kimi',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
    format: 'openai',
    keyHint: 'Kimi Key 格式为 <code>sk-</code> 开头 · <a href="https://platform.moonshot.cn" target="_blank">platform.moonshot.cn</a> 创建',
  },
  custom: {
    name: '自定义',
    url: '',
    model: '',
    format: 'openai',
    keyHint: '填写你的 API Key，并在下方填写 API 地址和模型名称',
  },
};
