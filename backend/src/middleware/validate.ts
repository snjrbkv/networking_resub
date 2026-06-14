/** Request validation middleware powered by Zod. */
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../utils/AppError";

/**
 * Validates req.body / req.query / req.params against a Zod schema shaped as
 * { body?, query?, params? }. Replaces the request parts with parsed values.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      // query/params are read-only getters in Express 5 but writable in 4.
      if (parsed.query) Object.assign(req.query, parsed.query);
      if (parsed.params) Object.assign(req.params, parsed.params);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }));
        return next(AppError.badRequest("Validation failed", details));
      }
      return next(err);
    }
  };
}
