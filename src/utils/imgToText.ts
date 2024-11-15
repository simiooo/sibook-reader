import { createWorker } from 'tesseract.js'
// import * as htmlparser2 from "htmlparser2";
import workerUrl from 'tesseract.js/dist/worker.min.js?url'
import { requestor } from './requestor';
function base64ToBytes(base64) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
}
const workerMap = new Map<string, Tesseract.Worker>(new Map())
export async function ImgToText(data?: string | Uint8Array, languages?: string[]) {
    if (!data) {
        throw Error('请传入图片')
    }
    let blob: Uint8Array
    if (!(data instanceof Uint8Array)) {
        blob = base64ToBytes(data)
    } else {
        blob = data
    }
    if(!languages || languages?.length === 0) {
        languages = ['chi_sim', 'jpn', 'eng',]
    }
    const languagesParam = languages
    const result_languages = languagesParam
    let worker: Tesseract.Worker 
    if(workerMap.has(JSON.stringify(languagesParam))) {
        worker = workerMap.get(JSON.stringify(languagesParam))
    } else {
        worker  = await createWorker(result_languages.join('+'), 1 , {
            workerPath: workerUrl,
            langPath: 'https://tessdata.projectnaptha.com/4.0.0',
            corePath: '/tesseract.js-core',
        });
        workerMap.set(JSON.stringify(languagesParam), worker)
    }
    
    const res  = await worker.recognize(new Blob([blob]), undefined, {
        text: true,
        hocr: true,
    });
    // await worker.terminate();
    const dom = document.createDocumentFragment()
    const root = document.createElement('div')
    root.innerHTML = res.data.hocr
    dom.appendChild(root)
    return dom
}

export async function imageToTextByRemote(image: string) {
    return requestor.post("/ai/ocr", {
        image
    })    
}
