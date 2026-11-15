const { z } = require("zod");

const saleSchema = z
  .object({
    customer: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid customer ID")
      .optional()
      .nullable(),

    customerName: z.string().trim().max(120).optional(),

    items: z
      .array(
        z
          .object({
            product: z
              .string()
              .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),

            quantity: z.coerce
              .number()
              .int()
              .min(1, "Quantity must be at least 1"),
          })
          .strict(),
      )
      .min(1, "At least one product is required")
      .max(100, "Maximum 100 products allowed"),

    discount: z.coerce.number().finite().min(0).default(0),

    taxRate: z.coerce.number().finite().min(0).max(100).default(0),

    paymentMethod: z
      .enum(["cash", "card", "bank_transfer", "other"])
      .default("cash"),

    paymentStatus: z.enum(["unpaid", "paid", "partial"]).default("paid"),
  })
  .strict()
  .superRefine((data, ctx) => {
    const productIds = data.items.map((item) => item.product);

    if (new Set(productIds).size !== productIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Duplicate products are not allowed",
      });
    }
  });

module.exports = { saleSchema };
