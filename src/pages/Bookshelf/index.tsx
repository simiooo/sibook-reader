import { Button, Col } from "antd";
import { Row } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileTextTwoTone } from '@ant-design/icons'
import BookNewButton from "../../components/BookNewButton";
import { Content } from "antd/es/layout/layout";
import { Layout } from "antd";
import { useBookState } from "../../store";
import BookItemList from "../../components/BookItemList";
import { useAsyncEffect, useRequest } from "ahooks";
import style from './index.module.css'
import { Spin } from "antd";
import { useDrop } from "ahooks";
import { Modal } from "antd";
import { Dropdown } from "antd";
import { useUpload } from "../../utils/useUpload";
import { message } from "antd";
import { useSet } from "ahooks";
import DropButton from "../../components/DropButton";
import ExportButton from "../../components/ExportButton";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import { Alert } from "antd";

export default function index() {
    const db_instance = useBookState(state => state.db_instance)
    const { upload, loading: uploadLoading } = useUpload()
    const [list, setList] = useState<any[]>([])
    const { runAsync, loading: listLoading } = useRequest(async () => {
        const res = await db_instance?.book_items?.toArray()
        setList(res ?? [])
    })
    const [dropModalOpen, setDropModalOpen] = useState<boolean>()
    const containerRef = useRef<HTMLElement>(null)
    useDrop(() => containerRef.current, {
        onFiles(e) {
            Promise.allSettled(e.map(file => upload({
                file, onError: (err => {
                    message.error(`${file.name} - ${err.message}`)
                })
            }))).finally(() => runAsync())
        },
        onDragEnter() {
            setDropModalOpen(true)
        },
        onDrop(e) {
            setDropModalOpen(false)
        },
        onDragLeave(e) {
            setDropModalOpen(false)
        }
    })

    const loading = useMemo(() => {
        return listLoading || uploadLoading
    }, [listLoading, uploadLoading])

    const [selected, { add, remove }] = useSet<string | undefined>([])

    const contextmenuList = useMemo<ItemType[]>(() => {
        let result: any[] = []
        switch (selected.size) {
            case 0:
                result = [
                    
                ]
                break;
            case 1:
                result = [
                   
                    {
                        label: <DropButton
                            keys={selected}
                        ></DropButton>
                    },
                    {
                        label: <ExportButton
                            keys={selected}
                        ></ExportButton>
                    },
                ]
                break;
            default:
                result = [
                    
                    {
                        label: <DropButton
                            keys={selected}
                        ></DropButton>
                    },
                    {
                        label: <ExportButton
                            keys={selected}
                        ></ExportButton>
                    },
                ]
        }
        return result
    }, [selected])



    return (
        <Layout
            ref={containerRef}
        >
            <Spin spinning={loading}>
                <Dropdown 
                menu={{ items: contextmenuList }} 
                trigger={['contextMenu']} 
                dropdownRender={(menu) => {
                    return selected.size > 1 ? menu : <Alert
                    message={'请选择'}
                    ></Alert>
                }}
                >
                    <Content className={style.content}>
                        <Row gutter={[20, 32]}>
                            <Col span={24}>
                                <Row justify={'end'}>
                                    <Col >
                                        <BookNewButton
                                            onChange={async () => {
                                                runAsync()
                                            }}
                                        ></BookNewButton>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row gutter={[20, 20]}>
                                    <Col span={24}>
                                        <BookItemList
                                            data={list}
                                            selected={selected}
                                            onAdd={add}
                                            onRemove={remove}
                                        ></BookItemList>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Row>
                                    <Col></Col>
                                </Row>
                            </Col>
                        </Row>
                    </Content>
                </Dropdown>
            </Spin>

            {dropModalOpen && <div
                className={style.upload_modal_container}
            >
                <div
                    className={style.upload_modal}
                >
                    <FileTextTwoTone
                        twoToneColor={'#222'}
                        style={{
                            fontSize: '10rem'
                        }}
                    />
                </div>
            </div>}
        </Layout>

    );
}
