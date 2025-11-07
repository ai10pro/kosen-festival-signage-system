import { z } from "zod";

// POST /api/images のリクエストボディスキーマ
// storageUrl: 実際に画像が配置されているURL
// contentId: 紐づけるコンテンツID
// order: 表示順 (任意, なければ 0)
export const createImageSchema = z.object({
  storageUrl: z.string().url("有効なURL形式で入力してください。"),
  storageKey: z.string().optional(),
  contentId: z.string().uuid("有効なコンテンツID（UUID）が必要です。"),
  groupId: z.string().uuid().optional(),
  order: z.number().int().min(0).optional(),
});

// PATCH /api/images/[id] のリクエストボディスキーマ
// 画像レコードの任意フィールドを更新可能にする（storageUrl, contentId, groupId）
export const updateImageSchema = z
  .object({
    storageUrl: z.string().url().optional(),
    storageKey: z.string().optional(),
    contentId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "更新するには少なくとも1つのフィールドを指定してください。",
  });

// クライアント向けの Image レスポンスタイプ (PrismaのImageモデルをベース)
export const ImageResponseSchema = z.object({
  id: z.string().uuid(),
  storageUrl: z.string().url(),
  fileHash: z.string(),
  order: z.number().int(),
  contentId: z.string().uuid(),
  groupId: z.string().uuid().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateImageRequest = z.infer<typeof createImageSchema>;
export type UpdateImageRequest = z.infer<typeof updateImageSchema>;
export type ImageResponse = z.infer<typeof ImageResponseSchema>;
