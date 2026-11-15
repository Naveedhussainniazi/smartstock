
const { z } = require("zod");

const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.union([
    z.string().trim().email("Invalid email address"),
    z.literal("")
  ]).optional(),
  phone: z.string().trim().min(7).max(20),
  company: z.string().trim().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional()
}).strict();

const updateCustomerSchema = customerSchema
  .partial()
  .refine(
    data => Object.keys(data).length > 0,
    { message: "At least one field is required" }
  );

module.exports = {
  customerSchema,
  updateCustomerSchema
};
