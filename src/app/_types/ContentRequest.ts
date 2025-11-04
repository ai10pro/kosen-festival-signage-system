import { z } from "zod";
import { ContentStatus } from "./Status";


export const createContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(200),
  status: z.enum(ContentStatus),
  uploaderId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  editors: z.array(z.string().uuid()).optional(),
});

export type CreateContentRequest = z.infer<typeof createContentSchema>;  