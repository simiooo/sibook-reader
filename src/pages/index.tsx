import { Flex, Layout, Result, Spin, message } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { Outlet, useLocation, useNavigate, useNavigation } from 'react-router-dom'
import BookTabs from '../components/BookTabs'
import style from './index.module.css'
import classNames from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import { useBookState } from '../store'
import { useAsyncEffect, useRequest } from 'ahooks'
import UploadContainer from '../components/UploadContainer'
import { useCacheBookTab } from '../utils/useCacheBookTab'
import { requestor } from '../utils/requestor'
import { User } from '../store/user.type'

export const ErrorBoundary = () => <div
    style={{
        display: 'flex',
        height: '90vh',
        width: '100vw',
        justifyContent: 'center',
        alignItems: 'center',
    }}
>
    <Result
        status={'error'}
        title="错误，请联系开发者"
    ></Result>
</div>

export const Component = function App() {
    const location = useLocation()
    const navigate = useNavigate()
    const renderClassName = useMemo(() => {
        return ['/', '/island'].includes(window.location.pathname)
    }, [location])
    const [userOnline, setUserOnline] = useState<boolean>(true)
    const isUserOnline = useBookState(state => state.isUserOnline)

    useAsyncEffect(async () => {
        setUserOnline(await isUserOnline())
    }, [location])
    useEffect(() => {
        if (!userOnline) {
            navigate('/login')
        }
    }, [userOnline])

    const {authorization, profile_update} = useBookState(state => state)

    useRequest(async () => {
        if(!authorization.token) {
            return 
        }
        try {
            const res = await requestor<{data?: User}>({
                url: '/profile/v/getSelfUserInfo'
            }) 
            if(!res.data?.data) {
                throw Error("获取用户信息失败")
            }
            profile_update(res.data.data)
        } catch (error) {
            message.error('获取用户信息失败')
        }
        

    }, {
        refreshDeps: [
            authorization,
        ]
    })
    const { state } = useNavigation()
    return (

        <div>
            <UploadContainer></UploadContainer>
            {userOnline && <Flex
                className={classNames({
                    [style.tabs_container]: renderClassName
                })}
            >
                <BookTabs
                    className={style.tabs}
                ></BookTabs>
            </Flex>}
            <Spin
                spinning={state === 'loading'}
                delay={100}
            >
                <Outlet></Outlet>
            </Spin>

        </div>

    )
}
