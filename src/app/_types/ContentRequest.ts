import { z } from "zod";
import { ContentStatus } from "./Status";
import { ImageResponseSchema } from "./ImageRequest";
import { userProfileSchema } from "@/app/_types/UserProfile";

// POST /api/contents のリクエストボディスキーマ
// ステータスは初期で"PENDING"に設定されるため、クライアントからは受け取らない
// エディター，アップローダーはログインユーザーに自動設定

export const contentImageUploadSchema = z.object({
  url: z.string().url(),
  order: z.number().min(0),
});

export const createContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(200),
  groupId: z.string().uuid().optional().nullable(),
  images: z.array(contentImageUploadSchema).min(0).max(5),
  tagIds: z.array(z.string().uuid()).min(0).optional(),
});

export const ContentResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.enum(ContentStatus),
  rejectionReason: z.string().nullable(),
  uploaderId: userProfileSchema,
  groupIds: z.array(z.string().uuid()),
  editors: z.array(userProfileSchema),
  images: z.array(ImageResponseSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateContentRequest = z.infer<typeof createContentSchema>;
export type ContentResponse = z.infer<typeof ContentResponseSchema>;
