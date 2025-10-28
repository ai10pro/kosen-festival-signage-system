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
    isPublic: z.boolean().optional(),
  })
  .refine((data) => data.order !== undefined || data.isPublic !== undefined, {
    message:
      "更新するには 'order' または 'isPublic' の少なくとも一つが必要です。",
  });

// クライアント向けの Image レスポンスタイプ (PrismaのImageモデルをベース)
export const ImageResponseSchema = z.object({
  id: z.string().uuid(),
  storageUrl: z.string().url(),
  fileHash: z.string().length(32),
  order: z.number().int(),
  isPublic: z.boolean(),
  contentId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateImageRequest = z.infer<typeof createImageSchema>;
export type UpdateImageRequest = z.infer<typeof updateImageSchema>;
export type ImageResponse = z.infer<typeof ImageResponseSchema>;
