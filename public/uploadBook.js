async function readFileAsBase64(
  file,
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = (reader?.result)?.split?.(",")[1];
      resolve(base64String);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}

async function uploadBook(
    ctx,
  ) {
    const data = ctx.data
      if (!data?.file) {
        throw Error("请传入文件");
      }
      const file = await readFileAsBase64(data.file);
      const hash = sha256().update(file).digest("hex");
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
          name: data.file.name,
          des: data.file.name,
          sort: dayjs().unix(),
          type: data.file.type,
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
        
      } else {
        throw (Error("上传失败"));
      }
    
  }