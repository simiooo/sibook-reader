import {Connection} from 'jsstore'
import JsStoreWorker from 'jsstore/dist/jsstore.worker?worker'
import { database } from './book_store'
export const connection = new Connection(new JsStoreWorker())
