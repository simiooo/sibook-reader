import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import 'normalize.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ConfigProvider } from 'antd'
import { inject } from '@vercel/analytics';
import { useTranslation, initReactI18next } from "react-i18next";
import i18n from "i18next";
import en from './translations/en.json'
import ja from './translations/ja.json'
import zh from './translations/zh.json'

inject()

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {translation: en},
      ja: {translation: ja},
      zh: {translation: zh},
    },
    lng: navigator.language.toLowerCase(), // if you're using a language detector, do not define the lng option
    fallbackLng: "en",

    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    }
  });

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
