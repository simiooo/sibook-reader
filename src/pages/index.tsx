import { Flex, Layout } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import BookTabs from '../components/BookTabs'
import style from './index.module.css'
import classNames from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import { useBookState } from '../store'
import { useAsyncEffect } from 'ahooks'
import UploadContainer from '../components/UploadContainer'

export default function App() {
    const location = useLocation()
    const navigate = useNavigate()
    const renderClassName = useMemo(() => {
        return window.location.pathname === '/'
    },[location])
    const [userOnline, setUserOnline] = useState<boolean>(true)
    const isUserOnline = useBookState(state => state.isUserOnline)

    useAsyncEffect(async () => {
        setUserOnline(await isUserOnline())
    }, [location])

    useEffect(() => {
        if(!userOnline) {
            navigate('/login')
        }
    }, [userOnline])
    return (
        <div>
            <UploadContainer></UploadContainer>
            {userOnline && <Flex 
            className={classNames({
                [style.tabs_container]: renderClassName
            })}
            >
                <BookTabs
                {...({className:style.tabs} as any)}
                ></BookTabs>
            </Flex>}
            <Outlet></Outlet>
        </div>

    )
}
