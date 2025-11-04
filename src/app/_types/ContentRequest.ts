import { z } from "zod";
import { ContentStatus } from "./Status";
import { ImageResponseSchema } from "./ImageRequest";

// POST /api/contents のリクエストボディスキーマ
export const createContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(200),
  status: z.enum(ContentStatus),
  uploaderId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  editors: z.array(z.string().uuid()).optional(),
});

export const ContentResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.enum(ContentStatus),
  rejectionReason: z.string().nullable(),
  uploaderId: z.string().uuid(),
  groupId: z.string().uuid().nullable(),
  editors: z.array(z.string().uuid()),
  images: z.array(ImageResponseSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateContentRequest = z.infer<typeof createContentSchema>;
