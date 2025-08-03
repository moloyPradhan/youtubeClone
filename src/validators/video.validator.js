import { z } from 'zod';

const publishAVideoSchema = z.object({
    title: z
        .string()
        .min(3, 'Title is required minimum 3 characters'),

    description: z
        .string()
        .min(10, "Description required minimum 10 characters")
        .max(50, "Description maximum contain 50 characters"),
});



export {
    publishAVideoSchema,
}