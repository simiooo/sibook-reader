import { Avatar, Button, Col, Divider, Menu, Popover, Row, Select, Space } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import style from './index.module.css'
import { ShopOutlined, TranslationOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useHover } from 'ahooks'
import { useBookState } from '../../store'

const maxWidth = '4.1rem'
const minWidth = '0rem'
export default function LeftMenu() {
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const { profile } = useBookState(state => state)
  const hover = useHover(ref)
  useEffect(() => {
    if (hover) {
      setCollapsed(false)
    } else {
      setCollapsed(true)
    }
  }, [hover])
  return (
    <div
      className={style.container}
      ref={ref}
    >
      <Menu
        style={{
          width: collapsed ? minWidth : maxWidth
        }}
        selectedKeys={[]}
        inlineCollapsed={true}
        onSelect={(e) => {
          switch (e.key) {
            case "island":
              navigate('/island')
              break
          }
        }}
        items={[

          {
            label: t('岛屿'),
            title: t('岛屿'),
            key: 'island',
            icon: <ShopOutlined />,
          },
          {
            icon: <Divider></Divider>,
            key: 'divider',
            disabled: true,
          },
          {
            label: <Select
              size='small'
              bordered={false}
              placeholder={
                t('选择语言')}
              onChange={(e) => {
                i18n.changeLanguage(e)
              }}

              value={i18n.language}
              options={[
                {
                  label: <Space><span>Chinese</span></Space>,
                  value: 'zh',
                },
                {
                  label: <Space><span>Japanese</span> </Space>,
                  value: 'ja',
                },
                {
                  label: <Space><span>English</span> </Space>,
                  value: 'en',
                },
              ]}
            ></Select>,
            title: t('选择语言'),
            key: 'language',
            icon: <TranslationOutlined />
          },
          {
            label: <Avatar
            size={'small'}
            style={{
              background: '#3498DB',
              color: '#fff',
              fontSize: '0.75rem',
              transform: 'translateX(-.25rem)'
            }}
          >
            {profile?.nickname?.[0] ?? t('我')}
          </Avatar>,
            title: profile?.nickname ?? t('我'),
            key: 'profile'
          }
        ]}
      ></Menu>
      <motion.div
        className={style.button}
        whileHover={{
          // backgroundColor: '#e2e2e2',
        }}
      ></motion.div>
    </div>
  )
}
