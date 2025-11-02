import CryptoJS from "crypto-js";

/**
 * 与えられた文字列からMD5ハッシュを生成
 * @param data ハッシュを生成する元の文字列
 * @returns 生成されたMD5ハッシュ文字列
 */
export const generateMD5Hash = (data: string): string => {
  return CryptoJS.MD5(data).toString();
};
