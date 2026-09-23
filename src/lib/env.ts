import { z } from "zod";

const envSchema = z.object({
  MEDIA_STACK: z.string().min(1),
  REVALIDATE_SECONDS: z.coerce.number().int().positive().default(14400),
  SITE_URL: z.url().default("http://localhost:3000"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "[env] invalid or missing environment variables:",
    result.error.flatten().fieldErrors,
  );
}

export const env = result.success
  ? result.data
  : {
      MEDIA_STACK: "",
      REVALIDATE_SECONDS: 14400,
      SITE_URL: "http://localhost:3000",
    };