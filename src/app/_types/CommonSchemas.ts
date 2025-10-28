import { z } from "zod";
import { Role } from "./Role";

export const userNameSchema = z
  .string()
  .min(5, { message: "ユーザー名を入力してください" });

export const passwordSchema = z
  .string()
  .min(8, { message: "パスワードは8文字以上で入力してください" });

export const userRoleSchema = z.nativeEnum(Role);

// prettier-ignore
export const isUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

export const uuidSchema = z.string().refine(isUUID, {
  message: "無効なUUID形式です",
});
