import { z } from "zod";
import { uuidSchema } from "@/app/_types/CommonSchemas";

// ImageRequest Schema: 画像のアップロード/更新に必要なデータ

/**
 * 画像のアップロード/更新リクエストのスキーマ
 * @note 現状はURLを貼り付けてハッシュ値を生成する方式
 */
export const ImageRequestSchema = z.object({
  storageUrl: z.string().url().optional().describe("画像の保存先URL"),
  contentId: uuidSchema,
  order: z
    .number()
    .int()
    .min(1, { message: "順序は1以上の整数である必要があります" }),
});
export type ImageRequest = z.infer<typeof ImageRequestSchema>;

// 画像削除リクエスト用スキーマ
export const ImageIdSchema = z.object({
  id: uuidSchema,
});
export type ImageId = z.infer<typeof ImageIdSchema>;
