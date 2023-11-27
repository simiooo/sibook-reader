import { createWorker } from 'tesseract.js'

function base64ToBytes(base64) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
  }
export async function ImgToText(data?: string | Uint8Array, languages?: string[]) {
    if(!data) {
        throw Error('请传入图片')
    }
    let blob : Uint8Array
    if(!(data instanceof Uint8Array)) {
        blob = base64ToBytes(data)
    } else {
        blob = data
    }
    const result_languages =  languages ?? ['chi_sim', 'jpn', 'eng',]
    const worker = await createWorker(result_languages.join('+'));
    const { data: { text } } = await worker.recognize(new Blob([blob]));
    await worker.terminate();
    return text
}