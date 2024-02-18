// import { useLocalStorageState } from 'ahooks';
import { Tabs } from 'antd';
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, } from 'react-router-dom';
import style from './index.module.css'
import { useCacheBookTab } from '../../utils/useCacheBookTab';

export interface PageType {
    type: 'shell' | 'reader';
    id: string;
    readerType?: 'epub' | 'pdf';
    name: string | JSX.Element;

}

// interface BookTabsProp {
//     className?: string;
// }

export default function BookTabs() {
    const [active, setActive] = useState<string>()
    const navigate = useNavigate()
    const location = useLocation()
    const {tabs, remove} = useCacheBookTab()
    useEffect(() => {
        setActive(location.pathname)
    }, [location])
    useEffect(() => {
        console.log(Object.values(tabs))
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
                        remove(e.toString())
                    }
            }}
            hideAdd={true}
            items={Object.values(tabs).map((tab) => {
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
