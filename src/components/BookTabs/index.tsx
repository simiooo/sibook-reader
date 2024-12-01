// import { useLocalStorageState } from 'ahooks';
import { Avatar, Col, Divider, Popover, Row, Space, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, } from 'react-router-dom';
import style from './index.module.css'
import { useBookState } from '../../store';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRequest } from 'ahooks';
import { requestor } from '../../utils/requestor';

export interface PageType {
    type: 'shell' | 'reader';
    id: string;
    readerType?: 'epub' | 'pdf';
    name: string | JSX.Element;

}

interface BookTabsProp {
    className?: string;
}

export default function BookTabs(p: BookTabsProp) {
    const [active, setActive] = useState<string>()
    const { t, i18n } = useTranslation()
    const { profile } = useBookState(state => state)
    const { tabs, tabs_remove } = useBookState(state => state)
    const navigate = useNavigate()
    const location = useLocation()
    const { runAsync: logout, loading: logouting } = useRequest(async () => {
        try {
            const res = await requestor({
                url: "/auth/logout",
                method: 'get'
            })
            localStorage.removeItem('authorization')
            navigate('/login')
        } catch (error) {

        }

    }, {
        manual: true
    })
    useEffect(() => {
        setActive(location.pathname)
    }, [location])
    const renderTabs = useMemo(() => {
        return Object.values(tabs ?? {})
    }, [tabs])
    return (
        <Row 
        align={'middle'}
        wrap={false}>
            <Col flex={'1 1'}>
                <Tabs
                    size='small'
                    className={style.tab}
                    activeKey={active}
                    onChange={(e) => {
                        navigate(e)
                    }}
                    type="editable-card"
                    onEdit={(e, action) => {
                        if (action === 'remove') {
                            if (location.pathname === e.toString()) {
                                setActive('/')
                                navigate('/')
                            }
                            tabs_remove(e.toString())
                        }
                    }}
                    hideAdd={true}
                    items={renderTabs.map((tab) => {
                        return {
                            label: tab.label,
                            key: tab.url,
                            value: tab.url,
                            closable: tab.closable
                        }
                    })}
                ></Tabs>
            </Col>
            <Col>
                <Popover
                    // trigger={'click'}
                    zIndex={1}
                    placement='bottomRight'
                    content={<div>
                        <Space
                            direction='vertical'
                        >
                            
                            <Button
                                // size='small'
                                danger
                                type="link"
                                loading={logouting}
                                onClick={() => {
                                    logout()
                                }}
                            >注销</Button>
                            <Button
                                // size='small'

                                type="text"
                                onClick={() => {
                                    navigate('/Profile')
                                }}
                            >个人中心</Button>
                            <div
                            style={{
                                height: '.24rem',
                                width: '1px'
                            }}
                            ></div>
                            <div
                            style={{
                                padding: '6px 16px',
                                whiteSpace:'break-spaces',
                                wordBreak: 'break-all'
                            }}
                            >{profile?.nickname}</div>
                            
                            {/* <Divider
                    type="vertical"
                  ></Divider> */}
                            {/* <div></div> */}
                        </Space>

                    </div>}
                >
                    <Avatar
                        size={'small'}
                        style={{
                            background: '#3498DB',
                            color: '#fff',
                            fontSize: '0.75rem',
                            transform: 'translateX(-.25rem)'
                        }}
                    >
                        {profile?.nickname?.[0] ?? t('我')}
                    </Avatar>
                </Popover>
            </Col>
        </Row>

    )
}
