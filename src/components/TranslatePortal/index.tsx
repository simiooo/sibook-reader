import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './index.module.css'
import { Button, Col, Popover, Row, Select, Space, Spin } from 'antd'
import { RedoOutlined, TranslationOutlined } from '@ant-design/icons'
import { useEventListener, useThrottle } from 'ahooks'
import useTextSelection, { State } from 'ahooks/lib/useTextSelection'
import { languages } from '../../utils/locale'
import { useTranslate } from '../../utils/useTranslate'

interface TranslatePortalProps {
}
export default function TranslatePortal(props: TranslatePortalProps) {
    const [selectedText, setSelectedText] = useState<string>()
    const selectedState = useTextSelection(document)
    useEventListener('mouseup', () => {
        setSelectedText(window.getSelection().toString())
    }, {
        target: document
    })

    const [targetLaugange, setTargetLanguage] = useState<string>('zh_CN')
    const [translatedText, { runAsync: translate, loading: translating }] = useTranslate(selectedText, {
        target: targetLaugange
    })
    const throttleText = useThrottle(selectedText, { leading: true })
    return (
        <div>{createPortal(<div
            className={styles.transalate_tooltip}
            onMouseUp={(e) => {
                e.stopPropagation()
                e.preventDefault()
            }}

            style={{
                position: 'absolute',
                display: selectedText?.length > 0 ? 'block' : 'none',
                left: selectedState?.left ?? -100,
                top: selectedState?.bottom ?? -100,

            }}
        >
            <Popover
                trigger={'click'}
                // title="翻译"
                destroyTooltipOnHide
                onOpenChange={(v) => {
                    if (v) {
                        translate()
                    } else {
                        setSelectedText('')
                    }
                }}
                content={<div
                    className={styles.transalate_container}
                >
                    <Row
                        gutter={[12, 10]}
                    >
                        <Col span={24}>
                            <div
                                className={styles.translate_target}
                            >
                                <Space>
                                    <Select
                                        // bordered={false}
                                        value={targetLaugange}
                                        onChange={v => {
                                            setTargetLanguage(v)
                                        }}
                                        placeholder={'请选择语言'}
                                        style={{
                                            width: '12rem'
                                        }}
                                        showSearch
                                        defaultValue={'zh_CN'}
                                        options={languages.map(el => ({
                                            label: el.language,
                                            value: el.code,
                                        }))}
                                    ></Select>
                                    <Button
                                        // type="link"
                                        icon={<RedoOutlined />}
                                        loading={translating}
                                        onClick={() => {
                                            translate()
                                        }}
                                    ></Button>
                                </Space>


                            </div>

                        </Col>
                        <Col span={24}>
                            <div
                                className={styles.transalate_container_body}
                            ><Row
                                gutter={[12, 24]}
                                wrap={false}
                            >
                                    <Col span={12}>
                                        <div>{throttleText}</div>
                                    </Col>
                                    <Col span={12}>
                                        <Spin
                                            spinning={translating}
                                        >
                                            <div
                                            style={{minHeight: '4rem'}}
                                            >
                                                <div>{translatedText}</div>
                                            </div>
                                        </Spin>
                                    </Col>
                                </Row></div>


                        </Col>
                    </Row>


                </div>}
            >
                <Button
                    type="primary"
                    size='small'
                    icon={<TranslationOutlined />}
                ></Button>
            </Popover>

        </div>, document.documentElement)}</div>
    )
}
