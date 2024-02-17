import style from './index.module.css'
import { Button, Col, List, Progress, Row } from 'antd'
import { SiWs } from '../../utils/jsClient';
import { useBookState } from '../../store';
import { CloudOutlined, MinusCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInterval } from 'ahooks';

export interface UploadTask {
    ws: SiWs;
    name: string;
    des: string;
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
    const uploadingTaskList = useBookState(state => state.uploadingTaskList)
    const [renderList, setRenderList] = useState(uploadingTaskList)
    useInterval(() => {
        setRenderList([...uploadingTaskList])
    }, 1000, { immediate: true })
    const [minus, setMinus] = useState<boolean>(true)
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
                            >{minus ? <CloudOutlined /> : <MinusCircleOutlined />}</div>
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

                            renderItem={(item: UploadTask) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.name}
                                        description={item.des}
                                        avatar={<Progress
                                            type="circle"
                                            size="small"
                                            status={item.ws.ws.readyState === WebSocket.CLOSED ? "exception" : undefined}
                                            percent={item.ws.getProgress() * 100}
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
