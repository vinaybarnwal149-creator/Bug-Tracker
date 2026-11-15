import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';

export const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;
    req.user.name = name;
    await req.user.save();

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

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'BAD_REQUEST', 'Current password does not match');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Revoke all refresh tokens to force re-login on other devices
    await RefreshToken.deleteMany({ user: user._id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
