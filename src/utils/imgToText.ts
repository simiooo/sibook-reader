import { createWorker } from 'tesseract.js'

function base64ToBytes(base64) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
  }
export async function ImgToText(base64_blob?: string, languages?: string[]) {
    if(!base64_blob) {
        throw Error('请传入图片')
    }
    const blob = base64ToBytes(base64_blob)
    const result_languages =  languages ?? ['chi_sim', 'jpn', 'eng',]
    const worker = await createWorker(result_languages.join('+'));
    const { data: { text } } = await worker.recognize(new Blob([blob]));
    await worker.terminate();
    return text
}