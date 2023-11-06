import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

export default function index() {

    return (
        <Outlet></Outlet>
    )
}
