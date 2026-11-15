
const { z } = require("zod");

const purchaseSchema = z.object({
  supplier: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID"),

  items: z
    .array(
      z.object({
        product: z
          .string()
          .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),

        quantity: z.coerce
          .number()
          .int()
          .min(1, "Quantity must be at least 1"),

        unitCost: z.coerce
          .number()
          .finite()
          .min(0, "Unit cost cannot be negative")
      })
    )
    .min(1, "At least one product is required")
    .max(100, "Maximum 100 products allowed"),

  taxRate: z.coerce
    .number()
    .finite()
    .min(0)
    .max(100)
    .default(0)
}).strict().superRefine((data, ctx) => {
  const productIds = data.items.map(item => item.product);

  if (new Set(productIds).size !== productIds.length) {
    ctx.addIssue({
      code: "custom",
      path: ["items"],
      message: "Duplicate products are not allowed"
    });
  }
});

module.exports = { purchaseSchema };
