import {Connection} from 'jsstore'
import { database } from './book_store'
const JsStoreWorker = await new Worker('/jsstore.worker.js', {
    type: 'classic'
})
export const connection = new Connection(JsStoreWorker)
connection.importScripts('/uploadBook.js')