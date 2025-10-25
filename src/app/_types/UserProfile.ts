import { z } from "zod";
import { userNameSchema, userRoleSchema, uuidSchema } from "./CommonSchemas";

export const userProfileSchema = z.object({
  id: uuidSchema,
  username: userNameSchema,
  role: userRoleSchema,
});

export type UserProfile = z.infer<typeof userProfileSchema>;
