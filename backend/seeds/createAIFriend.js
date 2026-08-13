/**
 * Creates (or updates) the AI friend account so it shows up in the sidebar
 * like any other contact.
 *
 *   node backend/seeds/createAIFriend.js
 *
 * Safe to re-run — it upserts by username.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const USERNAME = "aria";

const run = async () => {
	if (!process.env.MONGO_DB_URI) {
		console.error("MONGO_DB_URI is not set — check backend/.env");
		process.exit(1);
	}

	await mongoose.connect(process.env.MONGO_DB_URI);

	const existing = await User.findOne({ username: USERNAME });
	if (existing) {
		existing.isAI = true;
		await existing.save();
		console.log(`Updated existing AI friend: ${existing.fullName} (@${USERNAME})`);
		await mongoose.disconnect();
		return;
	}

	// Nobody logs into this account, so give it an unguessable password rather
	// than a known placeholder.
	const password = crypto.randomBytes(32).toString("hex");
	const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

	const aiUser = await User.create({
		fullName: "Aria",
		username: USERNAME,
		password: hashedPassword,
		gender: "female",
		profilePic: `https://avatar.iran.liara.run/public/girl?username=${USERNAME}`,
		isAI: true,
	});

	console.log(`Created AI friend: ${aiUser.fullName} (@${USERNAME})`);
	console.log("Open the app and pick Aria from the sidebar to chat.");
	await mongoose.disconnect();
};

run().catch(async (error) => {
	console.error("Failed to create AI friend:", error.message);
	await mongoose.disconnect();
	process.exit(1);
});
