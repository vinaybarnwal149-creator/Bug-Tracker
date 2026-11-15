import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload || !payload.sub) {
    return next(new ApiError(401, 'TOKEN_EXPIRED', 'Token is invalid or expired'));
  }

  try {
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'User not found'));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
