import { marked } from 'marked'
import React, { useMemo, useState } from 'react'

export type AiFeature = "digest" | "example" | "exercises" | "explain" | "recommandation" | "dataAnalysis"
export interface AiResponseProps {
    content?: string;
    type?: "digest" | "example" | "exercises" | "explain" | "recommandation" | "dataAnalysis";
}
import * as DOMPurify from 'dompurify'
import { Alert, Spin } from 'antd'
import { useRequest } from 'ahooks';
import { OPENAI_HEADERS, openai_stream_reader, useBookState } from '../../store';
import { useTranslation } from 'react-i18next';
import { LoginType } from '../../pages/Login';
const AiResponse = React.forwardRef(function (p: AiResponseProps, ref) {
    const { openaiRequest } = useBookState(state => state)
    const { t } = useTranslation()
    const [res, setRes] = useState<string[]>([])
    const [error, setError] = useState<Error | undefined>()
    const renderContent = useMemo(() => {
        return ((marked.parse(res?.join('') ?? '')))
    }, [res])
    const { runAsync, loading } = useRequest(async () => {
        try {
            setError(undefined)
            setRes([])
            const res = []
            const baseurl = import.meta.env.VITE_API_URL
            const url = `${/^https?:\/\//.test(baseurl) ? baseurl : location.origin + baseurl }`
            const authorization = JSON.parse(localStorage.getItem("authorization") ?? "{}") as LoginType
            OPENAI_HEADERS.set('Authorization', `Bearer ${authorization?.token}`)
            const openai_res = await fetch(`${url}/ai/openaiFeature`, {
                method: 'POST',
                headers: OPENAI_HEADERS,
                body: JSON.stringify({
                    content: JSON.stringify({
                        content: p.content,
                        responseLanguage: navigator.language
                    }),
                    featureType: p.type,
                })
            })
            if (openai_res.status !== 200) {
                throw Error(openai_res.statusText?.length > 0 ? openai_res.statusText : t('服务端异常, 请检查ai辅助设置是否正确'))
            }
            const reader = openai_res.body.getReader();

            return new Promise((resolve, reject) => {
                openai_stream_reader(reader, (line) => {
                    try {
                        if (line.startsWith('data:')) {
                            const data = line.replace('data: ', '');
                            if (data === '[DONE]') {
                                resolve(res)
                            } else {
                                
                                const json_data = JSON.parse(data)
                                res.push(json_data?.choices?.[0]?.delta?.content)
                                setRes([...res])
                            }
                        }
                    } catch (error) {
                        reject(error)
                    }
                    
                })
            }) 
        } catch (error) {
            setError((error && error instanceof Error) ? error : Error('未知错误'))

        }

    }, {
        // refreshDeps: [],
        manual: true,
    })
    ;(ref as any).current = { start: runAsync }
    return (
        <Spin
            spinning={loading}
        >
            <div
            style={{
                maxHeight: '50vh',
                overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{
                __html: renderContent
            }}
            ></div>
            {error ? <Alert
                type='error'
                message={error?.message}
            ></Alert> : undefined}
        </Spin>
    )
}
)

export default  AiResponse