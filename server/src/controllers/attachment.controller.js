import { Ticket } from '../models/Ticket.js';
import { ApiError } from '../utils/ApiError.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { can } from '../services/permissions.js';

export const uploadAttachments = async (req, res, next) => {
  try {
    const ticket = req.ticket;
    const allowed = can(req.myRole, 'upload_attachment', ticket, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to upload attachments');
    }

    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'BAD_REQUEST', 'No files uploaded');
    }

    if ((ticket.attachments.length + req.files.length) > 5) {
      throw new ApiError(400, 'BAD_REQUEST', 'Ticket cannot have more than 5 attachments');
    }

    const uploadedAssets = [];

    for (const file of req.files) {
      if (isCloudinaryConfigured) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `trackflow/${ticket.project}/${ticket._id}`,
              resource_type: 'image'
            },
            (err, result) => {
              if (err) return reject(err);
              resolve(result);
            }
          );
          stream.end(file.buffer);
        });

        uploadedAssets.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width: uploadResult.width,
          height: uploadResult.height,
          uploadedBy: req.user._id,
          uploadedAt: new Date()
        });
      } else {
        // Fallback data URI for local dev when Cloudinary is not configured
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype};base64,${base64}`;
        uploadedAssets.push({
          url: dataUrl,
          publicId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          width: 800,
          height: 600,
          uploadedBy: req.user._id,
          uploadedAt: new Date()
        });
      }
    }

    ticket.attachments.push(...uploadedAssets);
    await ticket.save();

    res.status(201).json({
      success: true,
      data: ticket.attachments
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAttachment = async (req, res, next) => {
  try {
    const ticket = req.ticket;
    const attachmentId = req.params.attachmentId;

    const attachment = ticket.attachments.id(attachmentId);
    if (!attachment) {
      throw new ApiError(404, 'NOT_FOUND', 'Attachment not found');
    }

    const allowed = can(req.myRole, 'delete_attachment', attachment, req.user._id);
    if (!allowed) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to delete this attachment');
    }

    if (isCloudinaryConfigured && attachment.publicId && !attachment.publicId.startsWith('local_')) {
      cloudinary.uploader.destroy(attachment.publicId).catch((err) => {
        console.warn('Failed to delete Cloudinary asset:', err.message);
      });
    }

    ticket.attachments.pull(attachmentId);
    await ticket.save();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
