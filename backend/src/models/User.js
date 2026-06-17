import mongoose, { Schema } from "mongoose";
var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["MAIN_ADMIN"] = "MAIN_ADMIN";
  UserRole2["COLLEGE_ADMIN"] = "COLLEGE_ADMIN";
  return UserRole2;
})(UserRole || {});
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"]
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: "COLLEGE_ADMIN" /* COLLEGE_ADMIN */,
      required: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
export {
  UserRole
};
export default User;
