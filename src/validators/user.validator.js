import { z } from 'zod';

const registerSchema = z.object({
    username: z.string().min(3, 'Username is required minimum 3 characters'),
    email: z.string().email("Must be a valid email"),
    fullName: z.string().min(3, 'Full name is required minimum 3 characters'),
    password: z.string().min(8, 'Password must contain 8 characters'),
});

const loginSchema = z.object({
    identifier: z.string().min(3, 'Identifier is required minimum 3 characters'),
    password: z.string().min(8, 'Password must contain 8 characters'),
});

const updateAccountDetailsSchema = z.object({
    fullName: z.string().min(3, 'Full name is required minimum 3 characters'),
    email: z.string().email("Must be a valid email"),
});





export {
    registerSchema,
    loginSchema,
    updateAccountDetailsSchema,
}