// db.ts
import Dexie, { Table } from "dexie";

export interface BookItems {
  name?: string;
  des: string;
  hash: string;
  fileType: string;
  sort: number;
}
export interface BookBlob {
  id?: string;
  blob?: string;
}

export class BookClassedDexie extends Dexie {
  book_items!: Table<BookItems>;
  book_blob!: Table<BookBlob>;

  constructor() {
    super("BookClassedDexie");
    this.version(1).stores({
        book_items: "name, hash, fileType", 
        book_blob: "id", 
    });
  }
}

export const db = new BookClassedDexie();
