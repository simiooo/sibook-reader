import { Col, Input, List, Modal, ModalProps, Row, Spin, Alert, Form, Select, Divider } from 'antd';
import React, { useEffect, useMemo, useState } from 'react'
import { ChatCompletion, OPENAI_PATHNAME, openai_stream_reader, useBookState } from '../../store';
import { useAntdTable, useRequest } from 'ahooks';
import { languages } from '../../utils/locale';

export interface ExplainModalProps extends ModalProps {
    text?: string;
}

export default function ExplainModal(p: ExplainModalProps) {
    const { text, ...modalProps } = p
    const [res, setRes] = useState<string[]>([])

    const [error, setError] = useState<Error>()
    const request = useBookState(state => state.openaiRequest)
    const [form] = Form.useForm()


    const { loading, runAsync, search } = useAntdTable(async ({ }, params) => {
        setError(undefined)
        let res = []
        if (!p.text || !p.open || !params?.language) {
            return
        }

        try {
            const openai_res = await request({
                type: 'explainer',
                message: {
                    language: params?.language,
                    message: p.text,
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
        } finally {
            setRes([])
        }
        return {
            list: [],
            total: 0
        }
    }, {
        refreshDeps: [
            p.text,
            p.open,
        ],
        form
    })

    const renderRes = useMemo(() => {
        return `${res.join('')}${loading ? '_' : ''}`
    }, [res, loading])

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
                            showCount
                            value={p.text}
                        ></Input.TextArea>
                    </Col>
                    <Col span="12">
                        <Spin spinning={loading}>
                            <Input.TextArea
                                rows={10}
                                showCount
                                value={renderRes}
                            ></Input.TextArea>
                        </Spin>
                        <div
                            style={{ height: '1rem' }}
                        > </div>
                        <Form.Item
                            noStyle
                            name="language"
                        >
                            <Select
                                showSearch
                                filterOption={true}
                                placeholder={'请选择选择语言'}
                                style={{
                                    width: '210px'
                                }}
                                options={languages.map(ele => ({ label: ele.language, value: ele.code }))}
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
