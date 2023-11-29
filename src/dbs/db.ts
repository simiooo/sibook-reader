// db.ts
import Dexie, { Table } from "dexie";
import { PackagingMetadataObject } from "epubjs/types/packaging";

interface PDFMetaType{
  Author?: string;
  Title?: string;
  Producer?: string;
  CreationDate?: string;
  [key: string]: string;
}

export interface BookItems <T extends Object = (PDFMetaType | PackagingMetadataObject)>{
  name?: string;
  des: string;
  hash: string;
  fileType: string;
  sort: number;
  meta?: T
}
export interface BookBlob {
  id?: string;
  blob?: Uint8Array;
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
