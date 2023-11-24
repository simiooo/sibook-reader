import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import 'normalize.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ConfigProvider } from 'antd'

const green = '#80aa51'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorError: '#E53935',
          colorPrimary: green,
          colorInfo: green,
          colorLink: green,
          colorSuccess: '#4CAF50',
          colorWarning: '#FFEB3B',
          fontSize: 16,
          // borderRadius: 8,

        },
      }}
    >
      <RouterProvider
        router={router}
      ></RouterProvider>
    </ConfigProvider>

  </React.StrictMode>,
)
