import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};
