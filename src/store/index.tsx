import { create } from "zustand";
import { BookClassedDexie, db } from "../dbs/db";
import { message } from "antd";
import { explainer, translator } from "../utils/openai_params_generator";
import { subscribeWithSelector } from 'zustand/middleware'
import { ClipboardType } from "../components/ClipboardList";
import { requestor } from "../utils/requestor";
import { UploadTask } from "../components/UploadContainer";
import { User } from "./user.type";
import { LoginType } from "../pages/Login";
import { HistoryTab } from "../utils/useCacheBookTab";
import { AxiosError } from "axios";
const OPENAI_BASE_URL = 'https://api.openai.com'
export const OPENAI_PATHNAME = '/ai/openai/v1/chat/completions'
export const OPENAI_HEADERS = new Headers()
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
    }) => Promise<Response>;
    uploadingTaskList: UploadTask[];
    uploadingTaskList_update: (uploadingTaskList:  UploadTask[]) => void;
    uploadingTaskListRead: () => void;
    profile?: User;
    profile_update?: (profile: User) => void;
    currentIsland: number;
    currentIsland_update?: (currentIsland: number) => void;
    tabs: HistoryTab;
    tabs_add: (tabs: HistoryTab) => void;
    tabs_remove: (key: string) => void;
    authorization: Partial<LoginType>
    authorization_update?: (authorization: Partial<LoginType>) => void;
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
        openaiRequest: async (body, customUrl?: string) => {
            const baseurl = import.meta.env.VITE_API_URL
            const url = `${/^https?:\/\//.test(baseurl) ? baseurl : location.origin + baseurl }${OPENAI_PATHNAME}`
            const authorization = JSON.parse(localStorage.getItem("authorization") ?? "{}") as LoginType 
            OPENAI_HEADERS.set('Authorization', `Bearer ${authorization?.token}`)
            return fetch(customUrl ?? url, {
                method: 'POST',
                headers: OPENAI_HEADERS,
                body: JSON.stringify(body.type == 'translator' ? translator(body.message, {model: get().openai_api_model}) : explainer(body.message, {model: get().openai_api_model}))
            })
        },
        isUserOnline: async () => {
            try {
                const authorization = JSON.parse(localStorage.getItem('authorization') ?? "{}") as Partial<LoginType> 
                // if(!authorization?.token) {
                //     throw Error('token 不存在')
                // }
                const res = await requestor({
                    url: '/profile/v/isUserOnline'
                })
                return res.status === 200
            } catch (error) {
                console.log(error)
                return error instanceof AxiosError ? error.response.status === 401 ? false : true : true
            }
            
        },
        uploadingTaskList: [],
        uploadingTaskList_update: (uploadingTaskList: UploadTask[]) => set({uploadingTaskList: [...uploadingTaskList]}),
        uploadingTaskListRead: () => set({uploadingTaskList: get().uploadingTaskList.map(val => ({
            ...val, 
            unread: false
        }))}),
        profile: [],
        profile_update: (profile: User) => set({profile}),
        currentIsland: Number(localStorage.getItem('currentIsland')),
        currentIsland_update: (currentIsland: number) => set({currentIsland}),
        tabs: JSON.parse(localStorage.getItem('tabs') ?? '{"/":{"url":"/","label":"首页","closable":false}}') ?? {
            "/": {
                url: '/',
                label: '首页',
                closable: false,
            }
        },
        tabs_add: (payload: HistoryTab) => set({
            tabs: {...get().tabs,
            [payload.url]: payload,}
        }),
        tabs_remove: (key: string) => {
            delete get().tabs[key]
            set({tabs: {...get().tabs}})
        },
        authorization: JSON.parse(localStorage.getItem('authorization') ?? '{}') as Partial<LoginType>,
        authorization_update: (payload: Partial<LoginType>) => set({authorization: payload})
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
    if(state.currentIsland && state.currentIsland.toString() !== localStorage.getItem('currentIsland')) {
        localStorage.setItem('currentIsland', state.currentIsland.toString())
    }
    if(state.tabs && state.tabs.toString() !== localStorage.getItem('tabs')) {
        localStorage.setItem('tabs', JSON.stringify(state.tabs))
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