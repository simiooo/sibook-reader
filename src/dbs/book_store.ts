import JsStore from 'jsstore'

const book_items = {
    name: 'BookItems',
    columns: {

        name:  { notNull: true, dataType: "string" },
        des:  { notNull: true, dataType: "string" },
        hash: {primaryKey: true, notNull: true, dataType: 'string'},
        fileType: {dataType: "string"},
        sort: {dataType: "number"},
    },
}

const book_blob = {
    name: 'BookBlob',
    columns: {
        id:{ notNull: true , dataType: 'string' },
        blob : { dataType: "string" },
    },

}

export const database: JsStore.IDataBase = {
    name: 'books_db',
    tables: [
        book_items,
        book_blob,
    ],
    version: 2
}