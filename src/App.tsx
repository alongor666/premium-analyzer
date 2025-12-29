import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>保费收入多维度分析系统 - React版本</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          计数: {count}
        </button>
        <p>
          React + TypeScript + Vite项目已成功初始化！
        </p>
      </div>
      <div className="info">
        <h3>下一步：</h3>
        <ul>
          <li>运行 npm install 安装依赖</li>
          <li>运行 npm run dev 启动开发服务器</li>
          <li>开始迁移核心功能</li>
        </ul>
      </div>
    </div>
  )
}

export default App
