import { z } from "zod";

export const userNameSchema = z
  .string()
  .min(5, { message: "ユーザー名を入力してください" });

export const passwordSchema = z
  .string()
  .min(8, { message: "パスワードは8文字以上で入力してください" });

export const roleSchema = z.enum(["admin", "user"]);