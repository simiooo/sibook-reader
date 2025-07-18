import { message } from "antd"
import { useRequest } from "ahooks"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LoginType } from "../pages/Login"

export function useTranslate(content: string, params: {
    target?: string,
    source?: string,
    refreshDeps?: any[],
}) {
    const [output, setOutput] = useState<string[]>()
    const { t } = useTranslation()
    
    const renderOutputText = useMemo(() => {
        return output?.join?.('')
    }, [output])

    const { runAsync, loading } = useRequest(async () => {
        try {
            setOutput([])
            
            if (!params?.target) {
                throw Error(t('请选择待翻译语言'))
            }
            if (!content) {
                throw Error(t('翻译内容不能为空'))
            }

            // Create SSE connection to new Golang server
            const sourceLang = params?.source || 'auto'
            const targetLang = params?.target
            
            // Construct the request URL
            const baseUrl = import.meta.env.VITE_API_URL || location.origin
            const url = `${baseUrl}/api/ai/translate`
            
            // Prepare request body
            const requestBody = {
                text: content,
                source_lang: sourceLang,
                target_lang: targetLang
            }

            // Create SSE request
            const token = JSON.parse(localStorage.getItem('authorization') ?? "{}") as LoginType
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token.token}`
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                throw Error(response.statusText || t('服务端异常, 请检查ai辅助设置是否正确'))
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw Error('无法读取响应流')
            }

            const decoder = new TextDecoder()
            const output: string[] = []
            let buffer = ''
            let isReading = true

            while (isReading) {
                const { done, value } = await reader.read()
                if (done) {
                    isReading = false
                    break
                }
                
                
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                let currentEvent = ''
                let currentData = ''

                for (const line of lines) {
                    
                    if (line.startsWith('event:')) {
                        currentEvent = line.slice(6).trim()
                    } else if (line.startsWith('data:')) {
                        currentData = line.slice(5).trim()
                        
                        try {
                            const data = JSON.parse(currentData)
                            if (currentEvent === 'start') {
                                // Handle start event - can be used for metadata
                                console.log('Translation started:', data)
                            } else if (currentEvent === 'chunk') {
                                // Handle chunk event - actual translation content
                                const chunk = data?.content || ''
                                
                                if (chunk) {
                                    output.push(chunk)
                                    setOutput([...output])
                                }
                            } else if (currentEvent === 'complete') {
                                // Handle complete event
                                console.log('Translation completed:', data)
                                isReading = false
                                break
                            } else if (currentEvent === 'error') {
                                // Handle error event
                                throw Error(data?.message || 'Translation error')
                            }
                        } catch (parseError) {
                            console.warn('Failed to parse SSE data:', currentData, parseError)
                        }
                    }
                }
            }

            reader.releaseLock()
        } catch (error) {
            message.error(error instanceof Error ? error.message : error)
            throw error
        }

    }, {
        manual: true
    })

    return [
        renderOutputText,
        {
            runAsync, 
            loading
        }
    ] as const
}