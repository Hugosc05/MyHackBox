import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8, "mínimo 8 caracteres").max(100),
  handle: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_.-]+$/, "solo letras, números, . _ -")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(100)
});

export const flagSchema = z.object({
  flag: z.string().min(1).max(200)
});

export const progressSchema = z.object({
  index: z.number().int().min(0).max(50),
  done: z.boolean().optional()
});
