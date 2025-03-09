// db.ts
import Dexie, { Table } from "dexie";
import { PackagingMetadataObject } from "epubjs/types/packaging";

interface PDFMetaType {
  Author?: string;
  Title?: string;
  Producer?: string;
  CreationDate?: string;
  [key: string]: string;
}

export interface BookItems<T extends Object = (PDFMetaType | PackagingMetadataObject)> {
  name?: string;
  des?: string;
  hash: string;
  fileType: string;
  sort: number;
  meta?: T
}
export interface BookBlob {
  id?: string;
  blob?: Uint8Array;
  coverBlob?: Uint8Array;
  updatedAt?: string;
}
export interface PdfNote {
  id?: string; /* pdf + pagination : pdf/pagiantion*/
  createAt?: string;
  content?: string;
}

export interface PdfPageImageCache {
  id: string;
  blob: Blob;
}

export class BookClassedDexie extends Dexie {
  book_items!: Table<BookItems>;
  book_blob!: Table<BookBlob>;
  pdf_notes!: Table<PdfNote>;
  pdf_page_image_cache!: Table<PdfPageImageCache>

  constructor() {
    super("BookClassedDexie");
    this.version(1).stores({
      book_items: "name, hash, fileType",
      book_blob: "id",
    });

    this.version(2).stores({
      book_items: "name, hash, fileType",
      book_blob: "id",
      pdf_notes: "&id,content",
    })

    this.version(3).stores({
      book_items: "name, hash, fileType",
      book_blob: "id",
      pdf_notes: "&id,content",
    })

    this.version(4).stores({
      book_items: "name, hash, fileType",
      book_blob: "id",
      pdf_notes: "&id,content",
      pdf_page_image_cache: "id",
    })
  }
}

export const db = new BookClassedDexie();
