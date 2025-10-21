import { z } from "zod";
import { userNameSchema, passwordSchema } from "./CommonASchemas";

export const loginRequestSchema = z.object({
  userName: userNameSchema,
  password: passwordSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
