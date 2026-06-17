import mongoose, { Schema } from "mongoose";
var EventImageCategory = /* @__PURE__ */ ((EventImageCategory2) => {
  EventImageCategory2["BANNER"] = "banner";
  EventImageCategory2["AUDIENCE"] = "audience";
  EventImageCategory2["OTHER"] = "other";
  return EventImageCategory2;
})(EventImageCategory || {});
const EventImageSchema = new Schema(
  {
    category: {
      type: String,
      enum: Object.values(EventImageCategory),
      default: "other" /* OTHER */,
      required: true
    },
    label: {
      type: String,
      trim: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    driveFileId: {
      type: String
    },
    driveWebViewLink: {
      type: String
    },
    driveWebContentLink: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);
const EventSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    programName: {
      type: String,
      required: [true, "Program name is required"],
      trim: true
    },
    participantsCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    winners: {
      type: [String],
      default: []
    },
    programDate: {
      type: Date,
      required: [true, "Program date is required"],
      index: true
    },
    programNature: {
      type: String,
      required: [true, "Program nature is required"],
      trim: true
    },
    guestDetails: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    images: {
      type: [EventImageSchema],
      default: []
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);
EventSchema.index({ programName: "text", programNature: "text", description: "text" });
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);
export {
  EventImageCategory
};
export default Event;
