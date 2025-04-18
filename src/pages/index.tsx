import { Button, Col, Flex, Layout, Result, Row, Space, Spin, message } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { Outlet, useLocation, useNavigate, useNavigation } from 'react-router-dom'
import BookTabs from '../components/BookTabs'
import style from './index.module.css'
import classNames from 'classnames'
import { useEffect, useMemo, useState } from 'react'
import { useBookState } from '../store'
import { useAsyncEffect, useEventListener, useRequest } from 'ahooks'
import UploadContainer from '../components/UploadContainer'
import { useCacheBookTab } from '../utils/useCacheBookTab'
import { requestor } from '../utils/requestor'
import { User } from '../store/user.type'
import { useRefresh } from '../utils/useRefresh'

export const ErrorBoundary = (props) => {
    
    return <div

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
        >
            <Row
                gutter={[24, 24]}
                justify={'center'}>
                <Col>
                    <Space>
                        <Button
                            onClick={() => {
                                location.reload()
                            }}
                            type='primary'
                        >重新加载</Button>
                    </Space>
                </Col>
            </Row>

        </Result>
    </div>
}

export const Component = function App() {
    const location = useLocation()
    const navigate = useNavigate()
    const [refreshData, refresh, { loading: refreshLoading }] = useRefresh()
    useEventListener('load', () => {
        refresh()
    })
    const renderClassName = useMemo(() => {
        return ['/', '/island'].includes(window.location.pathname)
    }, [location])

    const isUserOnline = useBookState(state => state.isUserOnline)
    const { data: userOnline, } = useRequest(async () => {
        if (location.pathname === '/login') {
            return
        }
        return await isUserOnline()
    }, {
        refreshDeps: [
            location
        ]
    })
    useAsyncEffect(async () => {
        // console.log(userOnline)
        if (typeof userOnline === 'boolean' && !userOnline) {
            navigate('/login')
        }
    }, [userOnline])

    const { authorization, profile_update } = useBookState(state => state)

    useRequest(async () => {
        // console.log(authorization)
        if (!authorization.token) {
            return
        }
        if (location.pathname === '/login') {
            return
        }
        try {
            const res = await requestor<{ data?: User }>({
                url: '/profile/v/getSelfUserInfo'
            })
            if (!res.data?.data) {
                throw Error("获取用户信息失败")
            }
            profile_update(res.data.data)
        } catch (error) {
            message.error('获取用户信息失败')
        }


    }, {
        refreshDeps: [
            authorization,
            location,
        ]
    })
    const { state } = useNavigation()




    return (

        <div>
            <UploadContainer></UploadContainer>
            {(!location.pathname.startsWith('/login') || userOnline) && <Flex
                className={classNames({
                    [style.tabs_container]: renderClassName
                })}
            >
                <BookTabs
                    className={style.tabs}
                ></BookTabs>
            </Flex>}
            <Spin
                spinning={state === 'loading' || refreshLoading}
                delay={100}
            >
                <Outlet></Outlet>
            </Spin>

        </div>

    )
}
