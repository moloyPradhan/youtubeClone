import { ZodError } from 'zod';

const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        return next();
    } catch (err) {
        if (err instanceof ZodError) {
            const errors = err.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            }));

            return res.status(400).json({
                success: false,
                statusCode: 400,
                message: 'Validation failed',
                errors,
                data: null,
            });
        }

        return res.status(500).json({
            success: false,
            statusCode: 500,
            message: err.message || 'Internal server error',
            errors: [],
            data: null,
        });
    }
};

export default validate;
