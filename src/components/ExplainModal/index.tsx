import { Col, Input, List, Modal, ModalProps, Row, Spin, Alert, Form, Select, Divider } from 'antd';
import React, { useState } from 'react'
import VirtualList from 'rc-virtual-list';
import { ChatCompletion, useBookState } from '../../store';
import { useAntdTable, useRequest } from 'ahooks';

export interface ExplainModalProps extends ModalProps {
    text?: string;
}

export default function ExplainModal(p: ExplainModalProps) {
    const { text, ...modalProps } = p
    const [res, setRes] = useState<string>()
    const [error, setError] = useState<Error>()
    const request = useBookState(state => state.openaiRequest)
    const [form] = Form.useForm()

    const { loading, runAsync, search } = useAntdTable(async ({}, params) => {
        setError(undefined)
        if (!p.text || !p.open) {
            return
        }
        try {
            const res = await request({
                type: 'explainer',
                message: {
                    language: params?.language ?? 'English',
                    message: p.text,
                }
            })
            const answer = (await res.json()) as ChatCompletion
            setRes(answer?.choices?.[0]?.message?.content)
        } catch (error) {
            setError(error instanceof Error ? error : Error(error))
        }
        return {
            list: [],
            total: 0
        }
    }, {
        refreshDeps: [
            p.text,
            p.open
        ],
        form
    })

    return (
        <Modal
            {...modalProps}
            footer={null}
            width={'80vw'}
            title="阐释"
        >
            <Form
                form={form}
                onValuesChange={() => search.submit()}
            >
                <Row gutter={[16, 16]}>
                    <Col span="12">
                        <Input.TextArea
                            rows={12}
                            value={p.text}
                        ></Input.TextArea>
                    </Col>
                    <Col span="12">
                        <Spin spinning={loading}>
                            <Input.TextArea
                                rows={10}
                                value={res}
                            ></Input.TextArea>
                        </Spin>
                        <div
                        style={{height: '1rem'}}
                        > </div>
                        <Form.Item
                            noStyle
                            name="language"
                        >
                            <Select
                            placeholder={'请选择选择语言'}
                            style={{
                                width: '210px'
                            }}
                            options={[
                                {
                                    label: '英语（美式）',
                                    value: 'en_US'
                                },
                                {
                                    label: '简体中文',
                                    value: 'zh_CN'
                                },
                                {
                                    label: '日语',
                                    value: 'ja_JP'
                                },
                            ]}
                            ></Select>
                        </Form.Item>
                    </Col>
                    <Alert
                        message={error?.message}
                        type="error"></Alert>
                </Row>
            </Form>
        </Modal>
    )
}
