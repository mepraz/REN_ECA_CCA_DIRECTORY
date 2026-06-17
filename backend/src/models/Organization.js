import mongoose, { Schema } from "mongoose";
const OrganizationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    totalEvents: {
      type: Number,
      default: 0
    },
    totalImages: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);
const Organization = mongoose.models.Organization || mongoose.model("Organization", OrganizationSchema);
export default Organization;
