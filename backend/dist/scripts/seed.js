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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_js_1 = __importStar(require("../src/models/User.js"));
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is not defined in your environment.");
    process.exit(1);
}
async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose_1.default.connect(MONGODB_URI);
        console.log("Connected to MongoDB.");
        const adminEmail = process.env.ADMIN_EMAIL || "admin@reliance.edu.np";
        const adminPassword = process.env.ADMIN_PASSWORD || "AdminReliance123!";
        const adminName = process.env.ADMIN_NAME || "Super Admin";
        console.log(`Checking if user with email ${adminEmail} already exists...`);
        const existingAdmin = await User_js_1.default.findOne({ email: adminEmail.toLowerCase() });
        if (existingAdmin) {
            console.log(`User with email ${adminEmail} already exists. Skipping seed.`);
            process.exit(0);
        }
        console.log("Hashing password...");
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 12);
        console.log("Creating MAIN_ADMIN user...");
        const newAdmin = new User_js_1.default({
            name: adminName,
            email: adminEmail.toLowerCase(),
            password: hashedPassword,
            role: User_js_1.UserRole.MAIN_ADMIN,
            isActive: true,
        });
        await newAdmin.save();
        console.log("-----------------------------------------");
        console.log("Seed successful!");
        console.log(`Role: ${User_js_1.UserRole.MAIN_ADMIN}`);
        console.log(`Name: ${adminName}`);
        console.log(`Email: ${adminEmail}`);
        console.log("Password: (Configured in environment or default password)");
        console.log("-----------------------------------------");
    }
    catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log("Database connection closed.");
    }
}
seed();
