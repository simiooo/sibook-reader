import { create } from "zustand";



export interface BookStateType {
    db_instance: Connection | null;
}

export const useBookState = create<BookStateType>(() => {
    return {
        db_instance: connection,
    }
})
