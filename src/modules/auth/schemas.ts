import { z } from "zod";

const password = z
  .string()
  .min(8, "Heslo musí mít alespoň 8 znaků.")
  .regex(/[a-zA-Z]/, "Heslo musí obsahovat alespoň jedno písmeno.")
  .regex(/[0-9]/, "Heslo musí obsahovat alespoň jednu číslici.");

const phone = z
  .string()
  .trim()
  .min(9, "Zadejte platné telefonní číslo.")
  .regex(
    /^\+?[0-9 ]+$/,
    "Telefonní číslo může obsahovat jen číslice, mezery a úvodní +.",
  );

export const registerSchema = z
  .object({
    role: z.enum(["customer", "driver"], { error: "Vyberte roli." }),
    firstName: z.string().trim().min(1, "Zadejte jméno."),
    lastName: z.string().trim().min(1, "Zadejte příjmení."),
    email: z.email("Zadejte platný e-mail.").trim(),
    phone,
    password,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    error: "Hesla se neshodují.",
    path: ["passwordConfirm"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Zadejte platný e-mail.").trim(),
  password: z.string().min(1, "Zadejte heslo."),
});

export type LoginInput = z.infer<typeof loginSchema>;
