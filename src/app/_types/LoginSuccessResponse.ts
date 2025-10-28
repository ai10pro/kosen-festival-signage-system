import { z } from "zod";
import { userProfileSchema } from "@/app/_types/UserProfile";

// ログイン成功時のペイロードスキーマ
export const loginSuccessResponseSchema = z.object({
  // ログインしたユーザーの基本情報
  userProfile: userProfileSchema,
  // パスワードが初期設定から変更済みかどうかを示すフラグ (初回ログイン判定用)
  isPasswordSet: z.boolean(),
});

// ZodスキーマからTypeScriptの型を抽出
export type LoginSuccessResponse = z.infer<typeof loginSuccessResponseSchema>;
