/* eslint-disable @typescript-eslint/no-this-alias */
import { S3Client, ListBucketsCommand, S3ClientConfig } from "@aws-sdk/client-s3";
import { fromHttp, fromTemporaryCredentials } from "@aws-sdk/credential-providers";
import { AwsV4Signer } from 'aws4fetch'
import { requestor } from "./requestor";
import dayjs from "dayjs";
import axios, { Axios, AxiosInstance, AxiosProgressEvent } from "axios";
import { resolve } from "path";
import { sha256 } from "./sha256";
type AWSCredentials = {
    accessKeyId: string,
    secretAccessKey: string,
    expiration: Date,
    sessionToken: string,
};

const credentialsInfo: AWSCredentials = {
    accessKeyId: '',
    secretAccessKey: '',
    expiration: dayjs('1970-01-01 00:00:00').toDate(),
    sessionToken: '',
}

const _s3Ins = new S3Client({
    region: import.meta.env.VITE_BACKBLAZED_REGION,
    endpoint: import.meta.env.VITE_BACKBLAZED_ENDPOINT,
    credentials: credentialsInfo
})
class S3Custom {
    private static _s3Instance: S3Client = new S3Client({
        region: import.meta.env.VITE_BACKBLAZED_REGION,
        endpoint: import.meta.env.VITE_BACKBLAZED_ENDPOINT,
        credentials: credentialsInfo
    })
    public static async create() {
        if (!dayjs().isBefore(credentialsInfo?.expiration)) {
            const res = await requestor<{ data: AWSCredentials; }>({
                url: '/backblaze/authorization',
                data: {}
            });
            S3Custom._s3Instance.destroy()
            S3Custom._s3Instance = new S3Client({
                region: import.meta.env.VITE_BACKBLAZED_REGION,
                endpoint: import.meta.env.VITE_BACKBLAZED_ENDPOINT,

                credentials: {
                    ...credentialsInfo,
                    ...res?.data.data,
                    expiration: new Date(res?.data?.data?.expiration),

                },

            })
        }
    }
    public static get s3() {
        return S3Custom._s3Instance;
    }
}

type BackblazeContrustorOptions = {
    region: string;
    bucketName: string;
}
class Backblaze {
    private _bucketName: string;
    private _region: string;
    private _authorizationInfo: AWSCredentials;
    private _error: Error;
    private _requestor: AxiosInstance


    constructor(options: BackblazeContrustorOptions) {
        this._bucketName = options.bucketName
        this._region = options.region

        this._requestor = axios.create({
            baseURL: new URL(this._bucketName, import.meta.env.VITE_BACKBLAZED_ENDPOINT).toString()
        })
        this._requestor.interceptors.request.use(async (config) => {

            if (!this._authorizationInfo) {
                await this._authorization()
            }
            const now = new Date();
            const isoString = now.toISOString();
            const datetime = isoString.replace(/[:-]/g, '').replace(/\.\d{3}Z$/, 'Z');
            const headers = config.headers
            headers.set('x-amz-user-agent', 'aws-sdk-js/3.645.0 ua/2.0 os/Windows#NT-10.0 lang/js md/browser#Chrome_128.0.0.0 api/s3#3.645.0')
            headers.set('x-amz-date', datetime)
            headers.set('amz-sdk-invocation-id', crypto.randomUUID())
            headers.set('amz-sdk-request', 'attempt=1; max=3')
            headers.set('x-amz-content-sha256', config.data ? await sha256(config.data) : '')
            
            const h = new Headers()
            const oriHeaders = headers.toJSON()
            for(const key in oriHeaders) {
                h.set(key, oriHeaders[key].toString())
            }
            
            h.set('Content-Type', 'application/octet-stream') 
            h.set('Content-Length', (config.data as ArrayBuffer)?.byteLength?.toString() ?? '0')
            h.delete('Accept')
            const signer = new AwsV4Signer({
                url: config.baseURL + config.url,                // required, the AWS endpoint to sign
                accessKeyId: this._authorizationInfo.accessKeyId,        // required, akin to AWS_ACCESS_KEY_ID
                secretAccessKey: this._authorizationInfo.secretAccessKey,    // required, akin to AWS_SECRET_ACCESS_KEY
                // sessionToken: this._authorizationInfo.sessionToken,       // akin to AWS_SESSION_TOKEN if using temp credentials
                method: config.method.toUpperCase(),             // if not supplied, will default to 'POST' if there's a body, otherwise 'GET'
                headers: h,            // standard JS object literal, or Headers instance
                body: config.data,               // optional, String or ArrayBuffer/ArrayBufferView – ie, remember to stringify your JSON
                // signQuery,          // set to true to sign the query string instead of the Authorization header
                service: 's3',            // AWS service, by default parsed at fetch time
                region: this._region,             // AWS region, by default parsed at fetch time
                // cache,              // credential cache, defaults to `new Map()`
                datetime: datetime,           // defaults to now, to override use the form '20150830T123600Z'
                appendSessionToken: false, // set to true to add X-Amz-Security-Token after signing, defaults to true for iot
                allHeaders: true,         // set to true to force all headers to be signed instead of the defaults
                singleEncode: false,       // set to true to only encode %2F once (usually only needed for testing)
            })
            //   await signer.sign()
            const Authorization = await signer.authHeader()
            config.headers.set('Authorization', Authorization)
            return config
        })
    }

    private async _authorization() {
        const res = await requestor<{ data: AWSCredentials; }>({
            url: '/backblaze/authorization',
            data: {}
        });
        this._authorizationInfo = res?.data?.data
    }


    shouldReAuthorization() {
        return !dayjs().isBefore(this._authorizationInfo.expiration)
    }

    async putObject(objectId: string, file: File, options?:{
        signal: AbortSignal
        onUploadProgress?: (progressEvent: AxiosProgressEvent) => void}) {
        // file.stream().getReader().read()

        const res = new Promise<string | ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (evt) => {
                // console.log(evt.target.result)
                resolve(evt.target.result)
            }
            reader.onerror = (evt) => {
                reject(evt)
            }
            reader.readAsArrayBuffer(file)
        })
        const content = await res
        const task = this._requestor({
            url: `/${objectId}`,
            method: 'put',
            data: content,
            signal: options?.signal,
            timeout: 1000 * 60 * 60,
            onUploadProgress: options?.onUploadProgress,
            headers: {
                "Content-Type": 'application/octet-stream',
                'X-Amz-Meta-Filename': encodeURIComponent(file.name),
                'X-Amz-Meta-Mimetype': encodeURIComponent(file.type),
            }
        })
        return task

    }
    getObject(objectId: string, options?: {
        signal: AbortSignal

        onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void}) {
        const task = this._requestor({
            url: `${objectId}`,
            method: 'get',
            signal: options?.signal,
            timeout: 1000 * 60 * 60,
            responseType: 'blob',
            onDownloadProgress: options?.onDownloadProgress,
        })
        
        return task
    }
}
// export const backblazeIns = new Proxy(S3Custom, {
//     async get(target, p) {

//         await target.create()

//         return target[p]
//     }
// })
export const backblazeIns = new Backblaze({
    region: import.meta.env.VITE_BACKBLAZED_REGION,
    bucketName: import.meta.env.VITE_BACKBLAZED_BUCKET_NAME,
})

type HttpProviderResponse = {
    AccessKeyId: string;
    SecretAccessKey: string;
    Token: string;
    AccountId?: string;
    Expiration: string; // rfc3339
};

export type ProgressFileEventCb = (info: {
    totalBytes: number,
    loadedBytes: number,
}) => void
export class ProgressFile {
    private _readerStream: ReadableStream
    private _totalBytes: number = 0;
    private _loadedBytes: number = 0;
    private _file: File;
    private _reader: ReadableStreamDefaultReader<Uint8Array>

    private _readListener: ProgressFileEventCb[]

    constructor(file: File) {
        // this._readerStream = new ReadableStream({
        //     cancel: (reason) => {
        //         this._reader.cancel();
        //     },
        //     start: (controller) => {
        //         this._file = file;
        //         this._reader = file.stream().getReader();
        //         this._totalBytes = file.size;
        //         this._readListener = []
        //         const read = () => {
        //             this._reader.read().then(({ done, value }) => {
        //                 if (done) {
        //                     controller.close();
        //                     return;
        //                 }

        //                 this._loadedBytes += value.byteLength;
        //                 controller.enqueue(value);
        //                 read();

        //             });
        //         }

        //         read();
        //     }
        // })
        this._readerStream = file.stream()
        this._file = file

        // this._file = new Proxy(file, {
        //     get(target, property) {
        //         console.log(target, property)
        //         return target[property]
        //     }
        // }) 
        // this._readerStream[Symbol.asyncIterator] = new Proxy(this._readerStream[Symbol.asyncIterator], {
        //   apply(target, thisArg, argArray) {

        //     const yieldRes = target(...argArray)

        //     return new Proxy(yieldRes, {
        //         get(target, p, receiver) {
        //             if(p === 'next') {
        //                 return new Proxy(target[p], {
        //                     apply(target, thisArg, argArray) {
        //                         console.log(argArray)
        //                         return target(...argArray)
        //                     }
        //                 })
        //             }
        //             return target[p]
        //         }
        //     })
        //   }  
        // }) 
    }

    get stream() {
        return this._readerStream
    }

    get totalBytes() {
        return this._totalBytes
    }

    get loadedBytes() {
        return this._loadedBytes
    }

    [Symbol.asyncIterator]() {
        return {
            next() {
                const result = {
                    value: undefined,
                    done: true,
                }
                return Promise.resolve(result)
            }
        }
    }

    get file() {
        return this._file;
    }

    onread(cb: ProgressFileEventCb) {
        this._readListener.push(cb)
    }
}
