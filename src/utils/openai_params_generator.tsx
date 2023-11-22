

export function translator(params: {
    target?: string,
    source?: string,
    message?: string,
}) {
    return {
        "messages": [
            {
                "role": "user",
                "content": `下面我让你来充当翻译家，你的目标是把${params?.source ?? '任意'}语言翻译成${params?.target ?? '英语'}，请使用古典主义式的、禅院僧侣式的严谨学术态度进行翻译。请翻译下面这句话：${params?.message ?? '这是一条测试消息。当您看到该消息时，说明翻译失败'}`
            },
        ],
        "model": "gpt-3.5-turbo",
        "temperature": 0.5,
        "presence_penalty": 0,
        "frequency_penalty": 0,
        "top_p": 1
    }
}

export function explainer(params: {
    language?: string;
    message?: string,
}) {
    return {
        "messages": [
            {
                "role": "user",
                "content": `Please play a role as professor to help me understand the statement below(reponse in ${params?.language ?? 'English'} language): ${params?.message}`
            },
        ],
        "model": "gpt-3.5-turbo",
        "temperature": 0.5,
        "presence_penalty": 0,
        "frequency_penalty": 0,
        "top_p": 1
    }
}