import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return next(new ApiError(422, 'VALIDATION_ERROR', 'Validation failed', details));
      }
      next(err);
    }
  };
};

export const validateParamsId = (paramName = 'id') => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return (req, res, next) => {
    const val = req.params[paramName];
    if (!val || !objectIdRegex.test(val)) {
      return next(new ApiError(400, 'BAD_REQUEST', `Invalid ID format for ${paramName}`));
    }
    next();
  };
};
