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

export default React.forwardRef(function AiResponse(p: AiResponseProps, ref) {
    const { openaiRequest } = useBookState(state => state)
    const { t } = useTranslation()
    const [res, setRes] = useState<string[]>([])
    const [error, setError] = useState<Error | undefined>()
    const renderContent = useMemo(() => {
        return ((marked.parse(res?.join('') ?? '')))
    }, [AiResponse])
    const { runAsync } = useRequest(async () => {
        try {
            setError(undefined)
            setRes([])
            let res = []
            const baseurl = import.meta.env.VITE_API_URL
            const url = `${/^https?:\/\//.test(baseurl) ? baseurl : location.origin + baseurl }`
            const authorization = JSON.parse(localStorage.getItem("authorization") ?? "{}") as LoginType
            OPENAI_HEADERS.set('Authorization', `Bearer ${authorization?.token}`)
            const openai_res = await (await fetch(`${url}/ai/openaiFeature`, {
                method: 'POST',
                headers: OPENAI_HEADERS,
                body: JSON.stringify({
                    content: p.content,
                    featureType: p.type,
                })
            })).json()
            if (openai_res.status !== 200) {
                throw Error(openai_res.statusText?.length > 0 ? openai_res.statusText : t('服务端异常, 请检查ai辅助设置是否正确'))
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
            setError((error && error instanceof Error) ? error : Error('未知错误'))

        }

    }, {
        // refreshDeps: [],
        manual: true,
    })
    // ref = React.createRef<null | {
    //     start: () => Promise<void>,
    // }>()
    ref.current = { start: runAsync }
    return (
        <Spin
            spinning={false}
        >
            <div>{renderContent}</div>
            {error ? <Alert
                type='error'
                message={error?.message}
            ></Alert> : undefined}
        </Spin>
    )
}
)
