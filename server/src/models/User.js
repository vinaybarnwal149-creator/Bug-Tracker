import mongoose from 'mongoose';

const AVATAR_PALETTE = [
  '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#84CC16'
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    avatarColor: {
      type: String,
      default: () => AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)]
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    }
  }
);

export const User = mongoose.model('User', userSchema);
