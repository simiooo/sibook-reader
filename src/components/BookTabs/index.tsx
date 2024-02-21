// import { useLocalStorageState } from 'ahooks';
import { Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, } from 'react-router-dom';
import style from './index.module.css'
import { useBookState } from '../../store';

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
    const {tabs, tabs_remove} = useBookState(state => state)
    const navigate = useNavigate()
    const location = useLocation()
    useEffect(() => {
        setActive(location.pathname)
    }, [location])
    const renderTabs = useMemo(() => {
        return Object.values(tabs ?? {})
    }, [tabs]) 
    return (
        <Tabs
            size='small'
            className={style.tab}
            activeKey={active}
            onChange={(e) => {
                navigate(e)
            }}
            type="editable-card"
            onEdit={(e, action) => {
                    if(action === 'remove') {
                        if(location.pathname === e.toString()) {
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
    )
}
