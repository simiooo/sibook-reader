import { pdfjs } from 'react-pdf';
import Epub from 'epubjs';
export async function pdfMetaParser(file: Uint8Array) {
    const pdf = await pdfjs.getDocument(file).promise
    const metadata = (await pdf.getMetadata())?.info
    return metadata
}
export async function epubMetaParser(file: Uint8Array) {
    if(!file?.buffer) {
        return
    }
    const book = Epub(file?.buffer)
    const meta = await book.loaded.metadata
    return meta
}