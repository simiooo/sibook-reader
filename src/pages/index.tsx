import { Flex, Layout } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { Outlet, useLocation } from 'react-router-dom'
import BookTabs from '../components/BookTabs'
import style from './index.module.css'
import classNames from 'classnames'
import { useEffect, useMemo } from 'react'

export default function index() {
    const location = useLocation()
    const renderClassName = useMemo(() => {
        return window.location.pathname === '/'
    },[location])
    return (
        <div>
            <Flex 
            className={classNames({
                [style.tabs_container]: renderClassName
            })}
            >
                <BookTabs
                className={style.tabs}
                ></BookTabs>
            </Flex>
            <Outlet></Outlet>

        </div>

    )
}
