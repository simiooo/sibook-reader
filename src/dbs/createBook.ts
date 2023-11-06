import dayjs from "dayjs";
import { sha256 } from "hash.js";
import { Connection } from "jsstore";

export async function readFileAsBase64(
  file: File,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = (reader?.result as string)?.split?.(",")[1];
      resolve(base64String);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}
export async function uploadBook(
  ctx: any,
) {
  const { info } = ctx.data;
  try {
    if (!info?.file) {
      throw Error("请传入文件");
    }
    console.log('1');
    
    const file = await readFileAsBase64(info.file);
    console.log('2');

    const hash = sha256().update(file).digest("hex");
    const hasSame = await ctx?.select({
      from: "BookItems",
      where: {
        hash,
      },
    });
    console.log('3');

    if ((hasSame ?? [])?.length > 0) {
      throw (Error("请勿重复上传文件"));
    }
    const res = await ctx?.insert({
      into: "BookItems",
      upsert: true,
      values: [{
        name: info.file.name,
        des: info.file.name,
        sort: dayjs().unix(),
        type: info.file.type,
        hash,
      }],
    });
    console.log('4');

    const res_blob = await ctx?.insert({
      into: "BookBlob",
      upsert: true,
      values: [{
        id: hash,
        blob: file,
      }],
    });
    console.log('5');

    if (res && res_blob) {
      info.onSuccess?.(res);
    } else {
      throw (Error("上传失败"));
    }
  } catch (error) {
    info?.onError?.(error instanceof Error ? error : Error("未知错误"));
  } finally {
  }
}
