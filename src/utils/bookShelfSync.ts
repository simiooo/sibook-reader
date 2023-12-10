import { BookClassedDexie } from "../dbs/db";

const BACKEND_BASE_URL = 'https://squirrelso.top:3000'
export interface remoteBookList {
  name: string;
  lastModified: string;
  etag: string;
  size: string;
  metadata?: {
    "Content-Type"?: string;
    name?: string;
    size?: number;
    hash?: string;
  };
}

export async function bookshelfSync(
  islandName: string,
  dbInstance: BookClassedDexie
):Promise<File[]> {
  const result = [];
  const localList = await dbInstance.book_items.toArray();
  const {
    data: remoteList,
    id: bucketId,
  }: { data: remoteBookList[]; id: string } = await fetch(
    new URL(`/book/${islandName}`, BACKEND_BASE_URL),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((data) => data.json());
  while (remoteList.length > 0) {
    const item = remoteList.shift();
    let localItemIndex:number = -1
    if ((localItemIndex = localList.findIndex((ele) => ele.hash === item.metadata?.['X-Amz-Meta-Hash'])) > -1) {
        localList.splice(localItemIndex, 1)
        continue;
    } else if (item?.metadata?.['X-Amz-Meta-Hash']) {
      const blob = fetch(new URL(`/book/getBookBinary`, BACKEND_BASE_URL) , {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucketName: bucketId,
          book_hash: item?.metadata?.['X-Amz-Meta-Hash'],
        }),
      }).then((data) => data.blob());
      result.push(new File([await blob],decodeURIComponent(item?.metadata?.['X-Amz-Meta-Name']), {
        type: item?.metadata?.["content-type"]
      }));
    }
  }
  if(localList.length > 0) {
    await Promise.all(localList.map(async ele => {
        const bookBlob = await dbInstance.book_blob.get(ele.hash)
        console.log(bookBlob)
        const fd = new FormData()
        fd.set('bucketName', bucketId)
        fd.set('hash', ele.hash)
        fd.set('file', new File([bookBlob.blob], ele.name, {
            'type': ele.fileType
        }))
        const res = await fetch(new URL(`/book/putBookToIsland`, BACKEND_BASE_URL), {
            method: 'POST',
            body: fd
        }).then(data => data.json())
    }))
  }
  return result
}
