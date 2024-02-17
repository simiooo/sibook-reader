interface UploadBookMessage {
    type: string;
    data: UploadBookMessageInit | UploadBookMessageProgress | UploadBookMessageEnd
}

interface UploadBookMessageInit {
    id: string;
    size: number;
    mimeType: string;
    filename: string;
}

interface UploadBookMessageProgress {
    id: string;
    size: number;
    mimeType: string;
    filename: string;
}

interface UploadBookMessageEnd {
    id: string;
    size: number;
    mimeType: string;
    filename: string;
}

type MessageType = 'init' | "progress" | "end" | "abort"

interface LoadRes {
    type: MessageType;
    message: string;
    status: 'success' | 'error';
}

type WsChangeCallback = (data: { value: string, progress: number }) => void;

export class SiWs {
    readonly CHUNK_SIZE: number = 0x1 * 0x400 * 0x400
    arraybuffer: string | ArrayBuffer | null | undefined
    status: MessageType
    sendIndex: number = 0
    ws?: WebSocket | null
    resStr: string = ''
    times: number = 0
    tasks: WsChangeCallback[] = []
    constructor(url: string) {
        this.ws = new WebSocket(url)
    }
    onchange(fn: WsChangeCallback) {
        this.tasks.push(fn)
    }
    init(file?: File, meta?: {[key: string]: string}) {
        if (!file) {
            return
        }
        if (!this.ws) {
            return
        }
        if (this.ws.readyState === WebSocket.CONNECTING) {
            // console.error('ws is not open')
            this.ws.onopen = () => {
                setTimeout(() => {
                    this.init(file)
                }, 500);
            }
            return
        }
        const data: UploadBookMessage = {
            type: "init",
            data: {
                id: file.name,
                size: file.size,
                mimeType: file.type,
                filename: file.name,
                ...(meta ?? {}),
            }
        }
        this.ws.send(JSON.stringify(data));
        this.ws.onmessage = (e) => {
            const datastring = e.data ?? "{}"
            this.resStr = datastring
            const data = JSON.parse(datastring) as LoadRes
            if (!file) {
                return
            }
            const rd = new FileReader()

            switch (data.type) {
                case "init":
                    {
                        if (!file) {
                            break
                        }
                        rd.readAsArrayBuffer(file)
                        if (data.status == 'success') {
                            this.status = 'init'
                            rd.onloadstart = (e) => {
                                console.log(e)
                            }
                            rd.onprogress = (e) => {
                                console.log(e)
                            }
                            rd.onerror = () => {

                            }
                            rd.onloadend = async (e) => {
                                if (!this.ws) {
                                    return
                                }
                                this.arraybuffer = e?.target?.result
                                if (this.arraybuffer instanceof ArrayBuffer) {
                                    const start = this.sendIndex * this.CHUNK_SIZE;
                                    let end = start + this.CHUNK_SIZE;
                                    if (end > this.arraybuffer.byteLength) {
                                        end = this.arraybuffer.byteLength;
                                    }
                                    const buf = new Uint8Array(this.arraybuffer.slice(start, end));
                                    const sendData = {
                                        type: "progress",
                                        data: {
                                            id: file?.name,
                                            index: this.sendIndex,
                                            blob: Array.from(buf)
                                        }
                                    }
                                    this.ws.send(JSON.stringify(sendData))
                                    this.sendIndex++;
                                    this.times = Math.floor(this.arraybuffer.byteLength / this.CHUNK_SIZE)
                                }

                            }
                        }
                    }
                    break
                case "progress":
                    {
                        if (!(this.arraybuffer instanceof ArrayBuffer)) {
                            break
                        }
                        if (!this.ws) {
                            return
                        }
                        if (this.sendIndex > this.times) {
                            this.ws.send(JSON.stringify({
                                type: "end",
                                data: {
                                    id: file?.name
                                }
                            }))
                            break
                        }
                        this.status = 'progress'
                        const start = this.sendIndex * this.CHUNK_SIZE;
                        let end = start + this.CHUNK_SIZE;
                        if (end > this.arraybuffer.byteLength) {
                            end = this.arraybuffer.byteLength;
                        }
                        for (const fn of this.tasks) {
                            fn({ value: data.message, progress: this.getProgress() })
                        }
                        const buf = new Uint8Array(this.arraybuffer.slice(start, end));
                        const sendData = {
                            type: "progress",
                            data: {
                                id: file?.name,
                                index: this.sendIndex,
                                blob: Array.from(buf)
                            }
                        }
                        this.ws.send(JSON.stringify(sendData))
                        this.sendIndex++;
                    }

                    break
                case "abort":
                case "end":
                    this.status = 'end'
                    this.sendIndex = 0
                    this.arraybuffer = null
                    this.times = 0
                    if (!this.ws) {
                        return
                    }
                    this.ws.close()
                    this.ws = null
                    this.resStr = ''
                    break

            }
        }
    }
    destroy() {
        this.sendIndex = 0
        this.arraybuffer = null
        this.times = 0
        if (!this.ws) {
            return
        }
        this.ws.close()
        this.ws = null
        this.resStr = ''
    }
    getProgress() {
        return this.sendIndex / this.times
    }
    abort() {
        this.ws.send(JSON.stringify({
            type: "abort",
        }))
    }
}