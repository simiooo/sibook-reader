import { create } from "zustand";
import { BookClassedDexie, db } from "../dbs/db";



export interface BookStateType {
    db_instance: BookClassedDexie | null;
}

export const useBookState = create<BookStateType>(() => {
    return {
        db_instance: db,
    }
})
