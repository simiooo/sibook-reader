import { create } from "zustand";
import { Connection } from 'jsstore'
import { connection } from "../dbs/jsstore_con";
import { database } from "../dbs/book_store";



export interface BookStateType {
    db_instance: Connection | null;
    workerLoading: boolean;
}

export const useBookState = create<BookStateType>(() => {
    return {
        db_instance: null,
        workerLoading: false,
    }
})
useBookState.setState({
    workerLoading: true
})

await connection.initDb(database)

useBookState.setState({
    db_instance: connection,
    workerLoading: false,
})