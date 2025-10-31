import { z } from "zod";

// POST /api/images のリクエストボディスキーマ
// storageUrl: 実際に画像が配置されているURL
// contentId: 紐づけるコンテンツID
// order: 表示順 (任意, なければ 0)
export const createImageSchema = z.object({
  storageUrl: z.string().url("有効なURL形式で入力してください。"),
  contentId: z.string().uuid("有効なコンテンツID（UUID）が必要です。"),
  order: z.number().int().min(0).optional(),
});

// PATCH /api/images/[id] のリクエストボディスキーマ
// order の更新のみを許可する（画像URLの変更は別操作とするため）
export const updateImageSchema = z
  .object({
    order: z.number().int().min(0).optional(),
  })
  .refine((data) => data.order !== undefined, {
    message:
      "更新するには 'order' フィールドを少なくとも1つ指定する必要があります。",
  });

// クライアント向けの Image レスポンスタイプ (PrismaのImageモデルをベース)
export const ImageResponseSchema = z.object({
  id: z.string().uuid(),
  storageUrl: z.string().url(),
  fileHash: z.string(),
  order: z.number().int(),
  contentId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateImageRequest = z.infer<typeof createImageSchema>;
export type UpdateImageRequest = z.infer<typeof updateImageSchema>;
export type ImageResponse = z.infer<typeof ImageResponseSchema>;
