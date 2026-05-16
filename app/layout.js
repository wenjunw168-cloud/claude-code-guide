import './globals.css';

export const metadata = {
  title: 'Claude Code 从入门到精通',
  description: '面向工程师与产品经理的 AI 编程完全指南',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
