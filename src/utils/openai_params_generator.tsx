export type AIOptionsType = Partial<{
    "model": string,
    "temperature": number,
    "presence_penalty": number,
    "frequency_penalty": number,
    "top_p": number,
    "max_tokens": number,
}>

export function translator(params: {
    target?: string,
    source?: string,
    message?: string,
}, options?: AIOptionsType) {
    return {
        "messages": [
            {
                "role": "user",
                "content": `下面我让你来充当翻译家，回答中只需要有翻译产物，不要带有无关内容。你的目标是把${params?.source ?? '任意'}语言翻译成${params?.target ?? '英语'}，请使用亚里士多德古典主义式的、禅院僧侣式的严谨学术态度进行翻译。请翻译下面这句话：${params?.message ?? '这是一条测试消息。当您看到该消息时，说明翻译失败'}`
            },
        ],
        "model": options?.model ?? "gpt-3.5-turbo-1106",
        "temperature": options?.temperature ?? 0.5,
        "presence_penalty": options?.presence_penalty ?? 0,
        "frequency_penalty": options?.frequency_penalty ?? 0,
        "top_p": options?.top_p ?? 1,
        "max_tokens": options?.max_tokens ?? 4096 * 2,
        stream: true,
    }
}

export function explainer(params: {
    language?: string;
    message?: string,
}, options?: AIOptionsType) {
    return {
        "messages": [
            {
                "role": "user",
                "content": `Tell me more about statement below in professional way, so i can understand the statement more carefully . If possible , you can act like Learned, Walter Bendix Schönflies Benjamin intellectuals or philosophers . Do not say anything unrelated to the statement . Here is the statement (answer in ${params?.language ?? 'English'} language): ${params?.message}`
            },
        ],
        "model": options?.model ?? "gpt-3.5-turbo-1106",
        "temperature": options?.temperature ?? 0.5,
        "presence_penalty": options?.presence_penalty ?? 0,
        "frequency_penalty": options?.frequency_penalty ?? 0,
        "top_p": options?.top_p ?? 1,
        "max_tokens": options?.max_tokens ?? 4096 * 2,
        stream: true,

    }
}