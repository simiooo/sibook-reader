import { Modal, ModalProps, Divider, Row, Col, Spin, Alert, Input } from 'antd';
import React, { useEffect, useState } from 'react'
import { ChatCompletion, useBookState } from '../../store';
import { useRequest } from 'ahooks';
import style from './index.module.css'

export interface TranslateModalProps extends ModalProps {
    text?: string;
}

export default function TranslateModal(p: TranslateModalProps) {
    const { text, ...modalProps } = p
    const [res, setRes] = useState<string>()
    const [error, setError] = useState<Error>()
    const request = useBookState(state => state.openaiRequest)

    const { loading } = useRequest(async () => {
        setError(undefined)
        if (!p.text || !p.open) {
            return
        }
        try {
            const res = await request({
                type: 'translator',
                message: {
                    source: '英语',
                    target: '中文',
                    message: p?.text
                }
            })
            const answer = (await res.json()) as ChatCompletion
            setRes(answer?.choices?.[0]?.message?.content)
        } catch (error) {
            setError(error instanceof Error ? error : Error(error))
        }
    }, {
        refreshDeps: [
            p.text,
            p.open
        ]
    })
    return (
        <Modal
            {...modalProps}
            footer={null}
            width={'80vw'}
            title="翻译"
        >
            <Row
                gutter={[16, 16]}
            >
                <Col span={12}>
                    <Input.TextArea
                        value={p.text}
                        placeholder={'请复制内容'}
                        // disabled
                        rows={16}
                    ></Input.TextArea>

                </Col>
                <Col span={12}>
                    <Spin
                        spinning={loading}
                    >
                        <Input.TextArea
                            value={res}
                            // disabled
                            rows={16}
                        ></Input.TextArea>
                    </Spin>
                </Col>
                {
                    error ? <Alert
                        type='error'
                        message={error.message}
                    ></Alert> : undefined
                }
            </Row>
            <Divider></Divider>
        </Modal>
    )
}
