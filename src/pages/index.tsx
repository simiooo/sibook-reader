import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useBookState } from '../store'
import { useAsyncEffect, useRequest } from 'ahooks'
import { database } from '../dbs/book_store'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

export default function index() {
    const db_instance = useBookState(state => state.db_instance)
    const {loading} = useRequest(async () => {
        try {
            if(!db_instance) {
                throw Error('暂未初始化')
            }
            await db_instance.initDb(database)
            
        } catch (error) {
            console.error(error instanceof Error ? error?.message : '未知错误')
        }
    }, {
        refreshDeps: [
            db_instance
        ]
    })
  return (
    <Spin
    spinning={loading}
    size='large'
    indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
    >
        <Outlet></Outlet>
    </Spin>
    
  )
}
