import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
  getRefreshCookieOptions
} from '../utils/tokens.js';
import { env } from '../config/env.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const accessToken = generateAccessToken(user._id.toString());
    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + (env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || ''
    });

    res.cookie('refreshToken', rawRefreshToken, getRefreshCookieOptions());

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: user.toJSON()
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id.toString());
    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + (env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || ''
    });

    res.cookie('refreshToken', rawRefreshToken, getRefreshCookieOptions());

    res.json({
      success: true,
      data: {
        accessToken,
        user: user.toJSON()
      }
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (!rawRefreshToken) {
      throw new ApiError(401, 'UNAUTHORIZED', 'No refresh token provided');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingToken = await RefreshToken.findOne({ tokenHash });

    if (!existingToken) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid refresh token');
    }

    // Reuse detection
    if (existingToken.revokedAt) {
      // Token was already revoked - possible theft, invalidate all user's tokens
      await RefreshToken.deleteMany({ user: existingToken.user });
      res.clearCookie('refreshToken', getRefreshCookieOptions());
      throw new ApiError(401, 'TOKEN_REUSE_DETECTED', 'Token reuse detected. All sessions revoked.');
    }

    if (new Date() > existingToken.expiresAt) {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
    }

    const user = await User.findById(existingToken.user);
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User no longer exists');
    }

    // Rotate refresh token
    const newRawRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashToken(newRawRefreshToken);

    existingToken.revokedAt = new Date();
    existingToken.replacedBy = newTokenHash;
    await existingToken.save();

    const expiresAt = new Date(Date.now() + (env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt,
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || ''
    });

    const accessToken = generateAccessToken(user._id.toString());
    res.cookie('refreshToken', newRawRefreshToken, getRefreshCookieOptions());

    res.json({
      success: true,
      data: {
        accessToken,
        user: user.toJSON()
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshToken.findOneAndUpdate(
        { tokenHash },
        { revokedAt: new Date() }
      );
    }

    res.clearCookie('refreshToken', getRefreshCookieOptions());
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (err) {
    next(err);
  }
};
