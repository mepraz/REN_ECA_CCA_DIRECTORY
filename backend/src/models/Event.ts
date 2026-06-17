import mongoose, { Schema, Document, Model } from "mongoose";

export enum EventImageCategory {
  BANNER = "banner",
  AUDIENCE = "audience",
  OTHER = "other",
}

export interface IEventImage {
  _id?: mongoose.Types.ObjectId;
  category: EventImageCategory;
  label?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  driveWebContentLink?: string;
  uploadedAt: Date;
}

export interface IEvent extends Document {
  organizationId: mongoose.Types.ObjectId;
  programName: string;
  participantsCount: number;
  winners: string[];
  programDate: Date;
  programNature: string;
  guestDetails?: string;
  description?: string;
  images: IEventImage[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventImageSchema = new Schema<IEventImage>(
  {
    category: {
      type: String,
      enum: Object.values(EventImageCategory),
      default: EventImageCategory.OTHER,
      required: true,
    },
    label: {
      type: String,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    driveFileId: {
      type: String,
    },
    driveWebViewLink: {
      type: String,
    },
    driveWebContentLink: {
      type: String,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const EventSchema = new Schema<IEvent>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    programName: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
    },
    participantsCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    winners: {
      type: [String],
      default: [],
    },
    programDate: {
      type: Date,
      required: [true, "Program date is required"],
      index: true,
    },
    programNature: {
      type: String,
      required: [true, "Program nature is required"],
      trim: true,
    },
    guestDetails: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [EventImageSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ programName: "text", programNature: "text", description: "text" });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
