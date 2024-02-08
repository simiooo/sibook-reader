import { create } from "zustand";
import { BookClassedDexie, db } from "../dbs/db";
import { message } from "antd";
import { explainer, translator } from "../utils/openai_params_generator";
import { subscribeWithSelector } from 'zustand/middleware'
import { ClipboardType } from "../components/ClipboardList";
import { requestor } from "../utils/requestor";
const OPENAI_BASE_URL = 'https://api.openai.com'
export const OPENAI_PATHNAME = '/v1/chat/completions'
const OPENAI_HEADERS = new Headers()
OPENAI_HEADERS.append('Content-Type', 'application/json')

export interface BookStateType {
    db_instance: BookClassedDexie | null;
    openai_base_url?: string;
    openai_api_key?: string;
    openai_api_model?: string;
    clipboardList?: ClipboardType[];
    isUserOnline?: () => Promise<boolean>;
    clipboardList_update?: (payload: ClipboardType[]) => void;
    openai_update?: (params: {
        openai_base_url?: string, 
        openai_api_key?: string,
        openai_api_model?: string,
    }) => void;
    openaiRequest?: <T extends Object>(body: {
        type: 'translator' | 'explainer';
        message: T;
    }) => Promise<Response>
}

export type ChatCompletion = {
    id: string;
    object: string;
    created: number;
    model: string;
    system_fingerprint: string;
    
    choices: Array<{
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

export const useBookState = create<BookStateType>((set, get) => {
    return {
        clipboardList: JSON.parse(localStorage.getItem('clipboardList') ?? '[]'),
        clipboardList_update: (clipboardList: ClipboardType[]) => set({
            clipboardList: [...clipboardList].slice(0,300)
        }),
        db_instance: db,
        openai_base_url: localStorage.getItem('openai_base_url') ?? OPENAI_BASE_URL,
        openai_api_key: localStorage.getItem('openai_api_key') ?? undefined,
        openai_api_model: localStorage.getItem('openai_api_model') ?? undefined,
        openai_update: ({openai_base_url, openai_api_key, openai_api_model}) => set((state) => ({
            openai_base_url,
            openai_api_key,
            openai_api_model,
        })),
        openaiRequest: async (body) => {
            const url = new URL(OPENAI_PATHNAME, get().openai_base_url)
            OPENAI_HEADERS.set('Authorization', `Bearer ${get().openai_api_key}`)
            return fetch(url, {
                method: 'POST',
                headers: OPENAI_HEADERS,
                body: JSON.stringify(body.type == 'translator' ? translator(body.message, {model: get().openai_api_model}) : explainer(body.message, {model: get().openai_api_model}))
            })
        },
        isUserOnline: async () => {
            try {
                const res = await requestor({
                    url: '/profile/isUserOnline'
                })
                return res.status === 200
            } catch (error) {
                return false
            }
            
        }
    }
})

useBookState.subscribe((state) => {
    if(state.openai_api_key && state.openai_api_key !== localStorage.getItem('openai_api_key')) {
        localStorage.setItem('openai_api_key', state.openai_api_key)
    }
    if(state.openai_base_url && state.openai_base_url !== localStorage.getItem('openai_base_url')) {
        localStorage.setItem('openai_base_url', state.openai_base_url)
    }
    if(state.openai_api_model && state.openai_api_model !== localStorage.getItem('openai_api_model')) {
        localStorage.setItem('openai_api_model', state.openai_api_model)
    }
    if(state.clipboardList) {
        localStorage.setItem('clipboardList', JSON.stringify(state.clipboardList))
    }
})


export function openai_stream_reader(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    cb: (line: string) => void,
    ) {
    return new ReadableStream({
        start(controller) {
            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }
                    // 将 Uint8Array 转换为字符串
                    const string = new TextDecoder().decode(value, { stream: true });
                    // 处理可能的多行数据
                    const lines = string.split('\n');
                    lines.forEach(line => {
                        cb?.(line)
                    });
                    controller.enqueue(value);
                    push();
                }).catch(err => {
                    console.error('Stream reading error:', err);
                    controller.error(err);
                });
            }
            push();
        }
    });
}