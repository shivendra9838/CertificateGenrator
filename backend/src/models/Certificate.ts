import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: Date;
  uniqueCertificateId: string;
  format: 'pdf' | 'image' | 'both';
  filePaths: {
    pdf?: string;
    image?: string;
  };
  issuedBy: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    participantName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    eventOrInternship: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    date: {
      type: Date,
      required: true,
    },
    uniqueCertificateId: {
      type: String,
      required: true,
      unique: true,
    },
    format: {
      type: String,
      required: true,
      enum: ['pdf', 'image', 'both'],
    },
    filePaths: {
      pdf: {
        type: String,
        required: false,
      },
      image: {
        type: String,
        required: false,
      },
    },
    issuedBy: {
      type: String,
      required: true,
      trim: true,
      default: 'Head HR',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ participantName: 'text' });

certificateSchema.index({ generatedAt: -1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
