import { z } from "zod";

export const createExpenseSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: "กรุณาเลือกประเภท",
  }),
  category: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
  amount: z.number({ required_error: "กรุณากรอกจำนวนเงิน" })
    .positive("จำนวนเงินต้องมากกว่า 0")
    .max(999999999.99, "จำนวนเงินเกินขีดจำกัด"),
  description: z.string().max(500, "คำอธิบายต้องไม่เกิน 500 ตัวอักษร").optional(),
  merchantName: z.string().max(200, "ชื่อร้านค้าต้องไม่เกิน 200 ตัวอักษร").optional(),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  receiptImage: z.string().optional(),
});

export type CreateExpenseData = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpenseData = z.infer<typeof updateExpenseSchema>;
