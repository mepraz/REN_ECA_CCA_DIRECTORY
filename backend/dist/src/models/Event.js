"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventImageCategory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var EventImageCategory;
(function (EventImageCategory) {
    EventImageCategory["BANNER"] = "banner";
    EventImageCategory["AUDIENCE"] = "audience";
    EventImageCategory["OTHER"] = "other";
})(EventImageCategory || (exports.EventImageCategory = EventImageCategory = {}));
const EventImageSchema = new mongoose_1.Schema({
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
}, { _id: true });
const EventSchema = new mongoose_1.Schema({
    organizationId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
}, {
    timestamps: true,
});
EventSchema.index({ programName: "text", programNature: "text", description: "text" });
const Event = mongoose_1.default.models.Event || mongoose_1.default.model("Event", EventSchema);
exports.default = Event;
