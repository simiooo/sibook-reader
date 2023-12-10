import { useLocalStorageState } from 'ahooks';
import { Col, Row, Tabs, message } from 'antd';
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBookState } from '../../store';

export interface PageType {
    type: 'shell' | 'reader';
    id: string;
    readerType?: 'epub' | 'pdf';
    name: string | JSX.Element;
}

export default function BookTabs() {
    const [active, setActive] = useState<string>()
    const navigate = useNavigate()
    const { book_id } = useParams()
    const db_instance = useBookState(state => state.db_instance)
    const [list, setList] = useLocalStorageState<PageType[]>('keeping_pages', {
        defaultValue: [
            {
                name: '添加',
                id: 'create_book',
                type: 'shell',
            }
        ]
    })
    const location = useLocation()

    //初始化激活的标签
    useEffect(() => {
        if (location.pathname === '/') {
            setActive('create_book')
            return
        }
        if (!book_id) {
            return
        }
        setActive(book_id)

    }, [
        location,
        book_id,
    ])

    //如果有新书进来则添加至locastorage
    useEffect(() => {
        if (db_instance && ['/reader', '/pdf_reader'].find(ele => new RegExp(`^${ele}`).test(location.pathname))) {
            db_instance.book_items.where('hash').equals(book_id)
                .toArray()
                .then(data => {
                    const temp = [...list, {
                        type: 'reader',
                        id: data[0]?.hash,
                        readerType: data[0]?.fileType === 'application/pdf'
                            ? 'pdf'
                            : 'epub',
                        name: data[0]?.name,
                    } as const].reduce((pre, val) => {
                        return pre.set(val.id, val)
                    }, new Map<string, PageType>())
                    const tempArr = [...temp]
                    const createIndex = tempArr.findIndex(ele => ele?.[1]?.id === 'create_book')
                    const createEle = tempArr[createIndex]
                    tempArr.splice(createIndex, 1)
                    tempArr.push(createEle)
                    setList(tempArr.map(ele => ele[1]))
                })
        }
    }, [
        location,
        db_instance,
        book_id,
    ])
    return (
        <Row>
            <Col>
                <Tabs
                    size='small'
                    activeKey={active}
                    onChange={(e) => {
                        const target = list.find(el => el.id === e)
                        if (target.readerType === 'epub') {
                            navigate(`/reader/${e}`)
                        } else if (target.readerType === 'pdf') {
                            navigate(`/pdf_reader/${e}`)
                        } else if (target.type === 'shell') {
                            navigate('/')
                        } else {
                            message.error('Unknow Error')
                        }
                    }}
                    type="editable-card"
                    onEdit={(e) => {
                        if(typeof e === 'string' ) {
                            const targetIndex = list.findIndex(ele => ele.id === e)
                            if(targetIndex === -1) {
                                return
                            }
                            list.splice(targetIndex, 1)
                            setList([...list])
                        }
                    }}
                    hideAdd={true}
                    items={list.map((ele) => ({ label: ele.name, key: ele.id, closable: ele?.id !== 'create_book' }))}
                ></Tabs>
            </Col>
        </Row>
    )
}
