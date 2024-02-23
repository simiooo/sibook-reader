import { AlertOutlined, AlignCenterOutlined, FrownOutlined, RadarChartOutlined, ReadOutlined, SnippetsOutlined, SoundOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import React, { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ANIMATION_STATIC } from '../../pages/PdfReader'
import { Modal, Space, Tooltip } from 'antd'
import { useTranslation } from 'react-i18next'
import AiResponse, { AiFeature } from '../AiResponse'
import { useEventListener } from 'ahooks'
import dayjs from 'dayjs'
export type EpubEventTask = (eventName: string, cb?: (e?: Event) => void) => void;
export interface AiFeatureMenuProps {
    container_ref?: MutableRefObject<any>;
    customEventListener?: {
        "on"?: EpubEventTask;
        "off"?: EpubEventTask;
        
    };
}
export default function AiFeatureMenu(p?: AiFeatureMenuProps) {
    const [currentAiFeature, setCurrentAiFeature] = useState<AiFeature>()
    const { t } = useTranslation()
    const modal_ref = useRef<{ start: () => Promise<void> }>()
    const run = useCallback((rawText?: string) => {
        const text = rawText ?? window.getSelection().toString()
        
        if (text?.length > 0) {
            if (!currentAiFeature) {
                // message.warning('请选择一种工具选择模式')
                return
            }
            Modal.info({
                title: text,
                content: <AiResponse
                    ref={modal_ref}
                    type={currentAiFeature}
                    content={text}
                ></AiResponse>,
                maskClosable: true,
                width: '80%',
            })
            setTimeout(() => {
                modal_ref?.current?.start?.()
            }, 200);
        }
    }, [currentAiFeature, p?.customEventListener])

    useEventListener('mousedown', (e: MouseEvent) => {
        if (p?.customEventListener) {
            `           return`
        }
        const start = dayjs()
        const selectHandler = (e: MouseEvent) => {
            const end = dayjs()
            if (end.diff(start, 'millisecond') < 500) {
                p?.container_ref?.current?.removeEventListener('mouseup', selectHandler)
                return
            }
            run()
            p?.container_ref.current?.removeEventListener('mouseup', selectHandler)
        }
        p?.container_ref.current?.addEventListener?.('mouseup', selectHandler)

    }, {
        target: p?.container_ref
    })

    useEffect(() => {
        if (!p?.customEventListener) {
            return
        }
        
        p?.customEventListener?.on('mousedown', (e) => {
            const start = dayjs()
            const selectHandler = (e: MouseEvent) => {
                const end = dayjs()
                if (end.diff(start, 'millisecond') < 500) {
                    p?.customEventListener?.off('mouseup', selectHandler)
                    return
                }
                run(e?.view?.getSelection?.()?.toString())
                p?.customEventListener?.off('mouseup', selectHandler)
            }
            p?.customEventListener?.on?.('mouseup', selectHandler)
        })
    }, [p.customEventListener, currentAiFeature])

    const renderAiFeature = useMemo(() => {
        return [
            {
                "title": "普通模式",
                "key": undefined,
                icon: AlignCenterOutlined,
            }, ,
            {
                "title": "摘要生成",
                "key": "digest",
                icon: SnippetsOutlined,
            },
            {
                "title": "阐释并列举例子",
                "key": "example",
                icon: AlertOutlined,
            },
            {
                "title": "生成练习题目",
                "key": "exercises",
                icon: FrownOutlined,
            },
            {
                "title": "名词解释",
                "key": "explain",
                icon: RadarChartOutlined,
            },
            {
                "title": "相关阅读推荐",
                "key": "recommandation",
                icon: ReadOutlined,
            },
            {
                "title": "数据解读",
                "key": "dataAnalysis",
                icon: SoundOutlined,
            }
        ] as const
    }, [])
    return (
        <Space
            size={'middle'}
        >
            {
                renderAiFeature.map(el => (
                    <motion.div
                        key={el.key}
                        {...ANIMATION_STATIC}
                    >
                        <Tooltip
                            title={t(el.title)}
                        >
                            <div
                                onClick={() => setCurrentAiFeature(el.key)}
                            ><el.icon
                                    style={{
                                        color: el.key === currentAiFeature ? '#80aa51' : undefined
                                    }}
                                /></div>

                        </Tooltip>
                    </motion.div>
                ))
            }
        </Space>
    )
}
