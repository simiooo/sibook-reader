import style from './index.module.css'
import { Badge, Button, Col, List, message, Popconfirm, Progress, Row, Space } from 'antd'
import { SiWs } from '../../utils/jsClient';
import { useBookState } from '../../store';
import { CloudDownloadOutlined, CloudOutlined, CloudUploadOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useInterval } from 'ahooks';
import { AxiosProgressEvent } from 'axios';

export type UploadTask = WsTask | HttpTask
type WsTask = {
    ws?: SiWs;
    name: string;
    unread?: boolean;
    error?: boolean;
    type?: 'upload' | 'download'
    des: string;
}
export type HttpTask = Omit<WsTask, 'ws'> & {
    httpMeta?: {
        size: number;
        current: number;
        error: boolean;
        id?: string;
        type: "upload" | "download",
        signal?: AbortController;
        onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
        onUploadProgress?: (type: string, ...others: any[]) => void;
    }
}

const container = {
    hidden: {
        height: '1rem',
        width: '1rem',
        transition: {
            duration: .5,
            type: "spring"
        }
    },
    show: {
        width: '24rem',
        height: '26rem',
        transition: {
            duration: .5,
            type: "spring"
        },

    }
}
export default function UploadContainer() {
    const { uploadingTaskList, uploadingTaskListRead, uploadingTaskList_update } = useBookState(state => ({
        uploadingTaskList: state.uploadingTaskList,
        uploadingTaskListRead: state.uploadingTaskListRead,
        uploadingTaskList_update: state.uploadingTaskList_update,
    }))
    const [renderList, setRenderList] = useState(uploadingTaskList)
    useInterval(() => {
        setRenderList([...uploadingTaskList])
    }, 1000, { immediate: true })
    const unreadCount = useMemo(() => {
        return (renderList ?? []).filter(val => val?.unread)?.length ?? 0
    }, [renderList])
    useEffect(() => {
        if (unreadCount > 0) {
            setMinus(false)
        }
    }, [unreadCount])
    const [minus, setMinus] = useState<boolean>(true)
    useEffect(() => {
        if (!minus) {
            uploadingTaskListRead()
        }
    }, [minus])
    return (

        <motion.div
            variants={container}
            initial="hidden"
            whileHover={{
                scale: 1.02,
                boxShadow: '0px 0px 4px #222'
            }}
            animate={!minus ? "show" : "hidden"}
            className={classNames(style.container, {
                [style.minus]: minus
            })}>
            <Row
                gutter={[15, 15]}
            >
                <Col
                    span={24}
                >
                    <Row align={'middle'} justify={'space-between'}>
                        {!minus && <Col><strong>传输列表</strong></Col>}
                        <Col>
                            <div
                                onClick={() => setMinus(!minus)}
                                style={{
                                    cursor: 'pointer'
                                }}
                            >{minus ? <Badge
                                size='small'
                                count={unreadCount}
                            ><CloudOutlined /></Badge> : <MinusCircleOutlined />}</div>
                        </Col>
                    </Row>
                </Col>
                <Col
                    span={24}
                >
                    <div
                        style={{
                            overflow: 'auto',
                            height: '24rem',
                        }}
                    >
                        <List
                            dataSource={renderList}
                            rowKey={(el) => el.name}
                            renderItem={(item: UploadTask, i) => 'ws' in item ? (
                                <List.Item
                                    actions={[
                                        <Popconfirm
                                            title="确认删除吗"
                                            onConfirm={() => {
                                                uploadingTaskList_update(uploadingTaskList.filter((_, index) => index !== i))
                                            }}
                                        >
                                            <Button
                                                type='link'
                                                danger
                                                icon={<DeleteOutlined />}

                                            >
                                            </Button>
                                        </Popconfirm>

                                    ]}
                                >
                                    <List.Item.Meta
                                        title={item.name}
                                        description={item.des}
                                        avatar={<Progress
                                            type="circle"
                                            size="default"
                                            format={(percent) => <div>
                                                <div>{`${percent}%`}</div>
                                                <CloudUploadOutlined /></div>}
                                            status={(
                                                item.ws?.status === 'abort' ||
                                                (item.ws?.ws?.readyState === WebSocket.CLOSED && item.ws.getProgress() < 1)
                                            ) ? "exception" : undefined}
                                            percent={Math.round(item.ws?.getProgress() * 10000) / 100}
                                        />}
                                    ></List.Item.Meta>
                                </List.Item>
                            ) : (
                                <List.Item
                                    actions={[
                                        <Popconfirm
                                            title="确认删除吗"
                                            onConfirm={() => {
                                                try {
                                                    const doc = uploadingTaskList.find((_, index) => index !== i)
                                                
                                                uploadingTaskList_update(uploadingTaskList.filter((_, index) => index !== i))
                                                if('httpMeta' in item && !item.httpMeta.signal.signal.aborted) {
                                                    item.httpMeta?.signal?.abort?.()
                                                }
                                                } catch (error) {
                                                    message.error(error?.message ?? error)
                                                }
                                                
                                            }}
                                        >
                                            <Button
                                                type='link'
                                                danger
                                                icon={<DeleteOutlined />}

                                            >
                                            </Button>
                                        </Popconfirm>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={item.name}
                                        description={item.des}
                                        avatar={<Progress
                                            type="circle"
                                            size="small"
                                            format={(percent) => <div>
                                                <div>{`${percent}%`}</div>
                                                <CloudDownloadOutlined /></div>}
                                            status={('httpMeta' in item && item.httpMeta?.error) ? 'exception' : undefined}
                                            percent={'httpMeta' in item ? Math.round(item.httpMeta?.current / item.httpMeta?.size * 10000) / 100 : 0}
                                        />}
                                    ></List.Item.Meta>
                                </List.Item>
                            )}
                        >
                        </List>
                    </div>
                </Col>
            </Row>



        </motion.div>


    )
}
