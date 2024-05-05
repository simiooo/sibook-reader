import { message } from "antd"
import { openai_stream_reader, useBookState } from "../store"
import { useRequest } from "ahooks"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export function useTranslate(content: string, params: {
    target?: string,
    model?: string,
    refreshDeps?: any[],
}) {
    const [output, setOutput] = useState<string[]>()
    const { t } = useTranslation()
    const { request } = useBookState(state => ({
        openai_api_model: state.openai_api_model ?? 'gpt-3.5-turbo',
        request: state.openaiRequest,
    }))
    const renderOutputText = useMemo(() => {
        return output?.join?.('')
    }, [output])
    const { runAsync, loading } = useRequest(async () => {
        try {
            setOutput([])
            // if (!params?.model) {
            //     throw Error(t('请选择模型'))
            // }
            if (!params?.target) {
                throw Error(t('请选择待翻译语言'))
            }
            if (!content) {
                throw Error(t('翻译内容不能为空'))
            }
            const openai_res = await request({
                type: 'translator',
                message: {
                    source: '任意',
                    target: params?.target ?? t('中文'),
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
    return [
        renderOutputText,
        {
            runAsync, loading
        }
    ] as const
}