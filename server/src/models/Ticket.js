import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  {
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    }
  }
);

const ticketSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    number: {
      type: Number,
      required: true
    },
    key: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    description: {
      type: String,
      maxlength: 5000,
      default: ''
    },
    type: {
      type: String,
      enum: ['bug', 'feature', 'task'],
      default: 'bug'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo'
    },
    position: {
      type: Number,
      required: true
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    labels: {
      type: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 24
      }],
      validate: [val => val.length <= 5, '{PATH} exceeds limit of 5 labels'],
      default: []
    },
    dueDate: {
      type: Date,
      default: null
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    commentCount: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: Date,
      default: null
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
        return ret;
      }
    }
  }
);

ticketSchema.index({ project: 1, number: 1 }, { unique: true });
ticketSchema.index({ project: 1, status: 1, position: 1 });
ticketSchema.index({ project: 1, assignee: 1 });
ticketSchema.index({ project: 1, priority: 1 });
ticketSchema.index({ project: 1, createdAt: -1 });
ticketSchema.index({ project: 1, key: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
