
const { z } = require("zod");

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),

  sku: z.string().trim().min(2).max(40),

  description: z.string().optional().default(""),

  category: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .nullable()
    .optional(),

  purchasePrice: z.coerce.number().min(0),

  sellingPrice: z.coerce.number().min(0),

  quantity: z.coerce.number().int().min(0).optional(),

  minStockLevel: z.coerce.number().int().min(0).optional(),

  unit: z.string().trim().min(1).optional(),
});

const updateProductSchema = productSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

module.exports = {
  productSchema,
  updateProductSchema,
};
