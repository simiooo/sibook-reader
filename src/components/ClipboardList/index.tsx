import { Button, Card, Col, Divider, Input, List, Popconfirm, Popover, Row, Select, Space, Spin, message } from 'antd';
import React, { useEffect, useState } from 'react'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
// import {AutoSizer} from 'react-virtualized'
import { openai_stream_reader, useBookState } from '../../store';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import { languages } from '../../utils/locale';
import { AI_MODELS } from '../../utils/openaiModels';
import { useRequest } from 'ahooks';

export interface ClipboardType {
    read?: boolean;
    content?: string;
    create_date?: string | number;
}
export interface ClipboardListProps {
    height?: number;
}
export default function ClipboardList(p: ClipboardListProps) {
    const { t } = useTranslation()
    const { clipboardList, clipboardList_update } = useBookState(state => state)

    const { openai_api_model, request } = useBookState(state => ({
        openai_api_model: state.openai_api_model ?? 'gpt-3.5-turbo-1106',
        request: state.openaiRequest,
    }))

    useEffect(() => {
        if (openai_api_model) {
            setModel(openai_api_model)
        }
    }, [openai_api_model])

    const [model, setModel] = useState<string>()
    const [target, setTarget] = useState<string>()
    const [content, setContent] = useState<string>()
    const [output, setOutput] = useState<string[]>()

    const { runAsync, loading } = useRequest(async () => {
        try {
            setOutput([])
            if (!model) {
                throw Error(t('请选择模型'))
            }
            if (!target) {
                throw Error(t('请选择待翻译语言'))
            }
            if (!content) {
                throw Error(t('翻译内容不能为空'))
            }
            const openai_res = await request({
                type: 'translator',
                message: {
                    source: '任意',
                    target: target ?? t('中文'),
                    message: content
                }
            })
            if (openai_res.status !== 200) {
                throw Error(openai_res.statusText?.length > 0 ? openai_res.statusText : t('服务端异常, 请检查ai辅助设置是否正确'))
            }
            const reader = openai_res.body.getReader();
            const output: string[] = []
            openai_stream_reader(reader, (line) => {
                
                if (line.startsWith('data:')) {
                    const data = line.replace('data: ', '');
                    if (data === '[DONE]') {
                        0
                    } else {
                        const json_data = JSON.parse(data)
                        output.push(json_data?.choices?.[0]?.delta?.content)
                        setOutput([...output])
                    }
                }
            })
        } catch (error) {
            message.error(error instanceof Error ? error.message : error)
        }

    }, {
        manual: true
    })

    return (
        <AutoSizer>
            {({ height, width }) => (
                <List
                    style={{
                        width,
                        height,
                        overflow: 'auto'
                    }}
                    dataSource={clipboardList}
                    renderItem={(ele, index) => (
                        <Row>
                            <Col flex={'1 1'}>
                                <Popover
                                    trigger={'click'}
                                    onOpenChange={(open) => {
                                        setOutput([])
                                        if (open) {

                                            setContent(ele.content)
                                        } else {
                                            setContent(undefined)
                                        }
                                    }}
                                    placement="left"
                                    title={<Row
                                        gutter={[8, 8]}
                                    >
                                        <Col

                                            span={24}>
                                            <Row

                                                justify={'space-between'}>
                                                <Col>{t('翻译')}</Col>
                                                <Col>
                                                    <Space>
                                                        {/* <Select
                                                            style={{
                                                                width: '10rem'
                                                            }}
                                                            defaultValue={openai_api_model}
                                                            value={model}
                                                            onChange={(e) => setModel(e)}
                                                            placeholder={t('请选择模型')}
                                                            options={AI_MODELS.map(ele => ({
                                                                label: ele.model,
                                                                value: ele.model,
                                                            }))}
                                                        ></Select> */}
                                                        <Select
                                                            style={{
                                                                width: '10rem'
                                                            }}
                                                            value={target}
                                                            showSearch
                                                            onChange={(e) => setTarget(e)}
                                                            options={languages.map(ele => ({ label: ele.language, value: ele.code }))}
                                                            placeholder={t('请选择待翻译语言')}
                                                        ></Select>
                                                        <Button
                                                            onClick={() => runAsync()}
                                                            type="link"
                                                            icon={<RedoOutlined />}>{t("翻译")}</Button>
                                                    </Space>
                                                </Col>
                                            </Row>
                                        </Col>
                                        <Col span={24}>
                                            <Spin
                                                spinning={loading}
                                            >
                                                <Input.TextArea
                                                    rows={6}
                                                    value={output?.join?.('')}
                                                ></Input.TextArea>
                                            </Spin>
                                        </Col>
                                    </Row>}
                                >
                                    <div
                                        style={{
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {ele.content}
                                    </div>

                                </Popover>
                            </Col>
                            <Col>
                                <Popconfirm
                                    title="Sure to delete?"
                                    placement='left'
                                    onConfirm={() => {
                                        clipboardList_update(clipboardList.filter((_, index2) => index2 !== index))
                                    }}
                                >
                                    <Button
                                        type="link"
                                        danger
                                        size='small'
                                        icon={<DeleteOutlined />}
                                    ></Button>
                                </Popconfirm>

                            </Col>
                            <Divider></Divider>
                        </Row>
                    )}
                ></List>
            )}

        </AutoSizer>
    )
}
