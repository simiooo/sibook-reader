import dayjs from "dayjs";
import { sha256 } from "../utils/sha256";

export async function readFileAsArrayBuffer(
  file: File,
): Promise<Uint8Array | undefined> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const buffer = (reader?.result as ArrayBuffer);
      resolve(new Uint8Array(buffer));
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsArrayBuffer(file);
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
    const file = await readFileAsArrayBuffer(info.file);

    const hash = await sha256(file)
    const hasSame = await ctx?.select({
      from: "BookItems",
      where: {
        hash,
      },
    });

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

    const res_blob = await ctx?.insert({
      into: "BookBlob",
      upsert: true,
      values: [{
        id: hash,
        blob: file,
      }],
    });

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
