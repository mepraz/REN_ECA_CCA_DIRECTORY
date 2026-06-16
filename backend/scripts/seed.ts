import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { UserRole } from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not defined in your environment.");
  process.exit(1);
}

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB.");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@reliance.edu.np";
    const adminPassword = process.env.ADMIN_PASSWORD || "AdminReliance123!";
    const adminName = process.env.ADMIN_NAME || "Super Admin";

    console.log(`Checking if user with email ${adminEmail} already exists...`);
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existingAdmin) {
      console.log(`User with email ${adminEmail} already exists. Skipping seed.`);
      process.exit(0);
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    console.log("Creating MAIN_ADMIN user...");
    const newAdmin = new User({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: UserRole.MAIN_ADMIN,
      isActive: true,
    });

    await newAdmin.save();
    console.log("-----------------------------------------");
    console.log("Seed successful!");
    console.log(`Role: ${UserRole.MAIN_ADMIN}`);
    console.log(`Name: ${adminName}`);
    console.log(`Email: ${adminEmail}`);
    console.log("Password: (Configured in environment or default password)");
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

seed();
