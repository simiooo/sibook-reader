import { Modal, ModalProps, Divider, Row, Col, Spin, Alert, Input, Select, Form } from 'antd';
import React, { useEffect, useMemo, useState } from 'react'
import { ChatCompletion, openai_stream_reader, useBookState } from '../../store';
import { useAntdTable, useRequest } from 'ahooks';
import style from './index.module.css'
import { languages } from '../../utils/locale';

export interface TranslateModalProps extends ModalProps {
    text?: string;
}

export default function TranslateModal(p: TranslateModalProps) {
    const { text, ...modalProps } = p
    const [res, setRes] = useState<string[]>([])
    const [error, setError] = useState<Error>()
    const request = useBookState(state => state.openaiRequest)
    const [form] = Form.useForm()

    const { loading, search } = useAntdTable(async (_, params) => {
        setError(undefined)
        setRes([])
        let res = []
        if (!p.text || !p.open) {
            return
        }
        if (!params?.target) {
            return
        }
        try {
            const openai_res = await request({
                type: 'translator',
                message: {
                    source: params?.source ?? '任意',
                    target: params?.target ?? '中文',
                    message: p?.text
                }
            })
            if (openai_res.status !== 200) {
                throw Error(openai_res.statusText?.length > 0 ? openai_res.statusText : '服务端异常, 请检查ai辅助设置是否正确')
            }
            const reader = openai_res.body.getReader();

            openai_stream_reader(reader, (line) => {
                if (line.startsWith('data:')) {
                    const data = line.replace('data: ', '');
                    if (data === '[DONE]') {

                    } else {
                        const json_data = JSON.parse(data)
                        res.push(json_data?.choices?.[0]?.delta?.content)
                        setRes([...res])
                    }
                }
            })
        } catch (error) {
            setError(error instanceof Error ? error : Error(error))
        }
        return {
            list: [],
            total: 0,
        }
    }, {
        form: form,
        refreshDeps: [
            p.text,
            p.open
        ]
    })

    const renderRes = useMemo(() => {
        return `${res.join('')}${loading ? '_' : ''}`
    }, [res, loading])
    return (
        <Modal
            {...modalProps}
            footer={null}
            width={'80vw'}
            title="翻译"
        >
            <Form
                form={form}
                onValuesChange={() => {
                    search.submit()
                }}
            >
                <Row
                    gutter={[16, 16]}
                >
                    <Col span={12}>
                        <Input.TextArea
                            value={p.text}
                            placeholder={'请复制内容'}
                            showCount
                            rows={16}
                        ></Input.TextArea>
                        <div style={{ height: '1rem' }}></div>
                        <Form.Item
                            noStyle
                            name="source"
                        >
                            <Select
                                showSearch
                                filterOption={true}
                                placeholder='请选择待翻译语言'
                                options={languages.map(ele => ({ label: ele.language, value: ele.code }))}
                            ></Select>
                        </Form.Item>

                    </Col>
                    <Col span={12}>
                        <Spin
                            spinning={loading}
                        >
                            <Input.TextArea
                                value={renderRes}
                                showCount
                                rows={16}
                            ></Input.TextArea>
                            <div style={{ height: '1rem' }}></div>

                            <Form.Item
                                noStyle
                                name="target"
                            >
                                <Select
                                    showSearch
                                    filterOption={true}
                                    placeholder='请选择目标语言'
                                    options={languages.map(ele => ({ label: ele.language, value: ele.code }))}
                                ></Select>
                            </Form.Item>

                        </Spin>
                    </Col>
                    {
                        error ? <Alert
                            type='error'
                            message={error.message}
                        ></Alert> : undefined
                    }
                </Row>
            </Form>

            <Divider></Divider>
        </Modal>
    )
}
