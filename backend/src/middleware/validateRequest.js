import { ZodError } from 'zod';

export function validateRequest({ bodySchema, querySchema, paramsSchema }) {
  return (req, res, next) => {
    try {
      if (bodySchema) {
        req.body = bodySchema.parse(req.body);
      }
      if (querySchema) {
        req.query = querySchema.parse(req.query);
      }
      if (paramsSchema) {
        req.params = paramsSchema.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: issues
        });
      }
      next(error);
    }
  };
}
