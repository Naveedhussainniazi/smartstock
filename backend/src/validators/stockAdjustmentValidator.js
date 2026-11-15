
const { z } = require("zod");

const stockAdjustmentSchema = z.object({
  product: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),

  type: z.enum(
    ["increase", "decrease"],
    {
      errorMap: () => ({
        message: "Type must be increase or decrease"
      })
    }
  ),

  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),

  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason cannot exceed 500 characters"),

  note: z
    .string()
    .trim()
    .max(1000, "Note cannot exceed 1000 characters")
    .optional()
    .default("")
}).strict();

module.exports = {
  stockAdjustmentSchema
};
