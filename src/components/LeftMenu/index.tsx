import { Avatar, Button, Col, Divider, Menu, Popover, Row, Select, Space, message } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import style from './index.module.css'
import { ShopOutlined, TranslationOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useHover, useRequest } from 'ahooks'
import { useBookState } from '../../store'
import useModal from 'antd/es/modal/useModal'
import { requestor } from '../../utils/requestor'
import IslandIcon from '../Icons/IslandIcon'

const maxWidth = '4.1rem'
const minWidth = '0rem'
export default function LeftMenu() {
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const { profile } = useBookState(state => state)
  const hover = useHover(ref)

  const [modal, modalContext] = useModal()

  

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
      {modalContext}
      <Menu
        style={{
          width: collapsed ? minWidth : maxWidth
        }}
        selectedKeys={[]}
        inlineCollapsed={true}
        mode="inline"
        onSelect={async (e) => {
          switch (e.key) {
            case "island":
              navigate('/island')
              break
            case 'language':
              {
                const res = modal.confirm({
                  title: t('选择语言'),
                  content: <Select
                    placeholder={t('选择语言')}
                    value={(t('选择语言'), i18n.language)}
                    onChange={(v) => {
                      i18n.changeLanguage(v)
                      res.destroy()
                    }}
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
                  >

                  </Select>,
                })
                try {
                  await res
                  res.destroy()
                } catch (error) {
                  message.error(error.message)
                }

              }
              break
          }
        }}
        items={[

          {
            label: t('岛屿'),
            title: t('岛屿'),
            key: 'island',
            icon: <IslandIcon />,
          },
          {
            icon: <Divider></Divider>,
            key: 'divider',
            disabled: true,
          },
          {
            label: t('选择语言'),
            title: t('选择语言'),
            key: 'language',
            icon: <TranslationOutlined />
          },
          // {
          //   label: ,
          //   title: profile?.nickname ?? t('我'),
          //   key: 'profile'
          // }
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
