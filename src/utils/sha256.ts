import { TypedArray } from "pdfjs-dist/types/src/display/api";

export async function sha256(input: Uint8Array | TypedArray) {
  // 支持字符串和Buffer
  if (typeof input === "string" || input instanceof Uint8Array) {
    const hash = await crypto.subtle.digest("SHA-256", input);
    const hashArray = Array.from(new Uint8Array(hash)); // 将缓冲区转换为字节数组
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  } else {
    throw new Error("Input must be a string or Uint8Array");
  }
}
