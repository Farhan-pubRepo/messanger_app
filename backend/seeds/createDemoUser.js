/**
 * Sets up the demo account used by the public deployment, so a visitor can look
 * around without signing up first. Creates the account and gives it a little
 * conversation history, otherwise every thread opens empty and the demo shows
 * nothing.
 *
 *   node backend/seeds/createDemoUser.js
 *
 * Safe to re-run — it upserts the account and rebuilds the seeded threads.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

dotenv.config();

const USERNAME = "demo";
const PASSWORD = "demo1234";

// [who said it, what they said]. "them" is the contact, "demo" is the visitor.
const THREADS = {
	"John Doe": [
		["them", "hey, you around this weekend?"],
		["demo", "should be, what's up?"],
		["them", "few of us are heading to the coast saturday"],
		["demo", "i'm in. what time are you leaving?"],
		["them", "9ish, i'll swing by and grab you"],
		["demo", "perfect, see you then 🤙"],
	],
	"Jane Doe": [
		["them", "did the deploy go through?"],
		["demo", "yep, went out about an hour ago"],
		["them", "nice. any issues with the socket connection in prod?"],
		["demo", "none so far, it's picking up the origin correctly now"],
		["them", "good, that one was annoying"],
	],
};

const run = async () => {
	if (!process.env.MONGO_DB_URI) {
		console.error("MONGO_DB_URI is not set — check .env");
		process.exit(1);
	}

	await mongoose.connect(process.env.MONGO_DB_URI);

	// 1. The account itself.
	const hashedPassword = await bcrypt.hash(PASSWORD, await bcrypt.genSalt(10));
	let demo = await User.findOne({ username: USERNAME });
	if (demo) {
		demo.password = hashedPassword;
		await demo.save();
		console.log(`Reset demo account: @${USERNAME} / ${PASSWORD}`);
	} else {
		demo = await User.create({
			fullName: "Demo User",
			username: USERNAME,
			password: hashedPassword,
			gender: "male",
			// Empty: the client draws initials locally, no external avatar host.
			profilePic: "",
		});
		console.log(`Created demo account: @${USERNAME} / ${PASSWORD}`);
	}

	// 2. Clear anything a previous run (or a visitor) left behind.
	const stale = await Conversation.find({ participants: demo._id });
	await Message.deleteMany({ _id: { $in: stale.flatMap((c) => c.messages) } });
	await Conversation.deleteMany({ _id: { $in: stale.map((c) => c._id) } });

	// 3. Rebuild the seeded threads, walking backwards from now so the
	//    timestamps read like a real conversation rather than a bulk insert.
	let seeded = 0;
	for (const [fullName, lines] of Object.entries(THREADS)) {
		const contact = await User.findOne({ fullName, isAI: { $ne: true } });
		if (!contact) {
			console.log(`  skipped "${fullName}" — no such contact`);
			continue;
		}

		let when = Date.now() - lines.length * 4 * 60 * 1000;
		const docs = lines.map(([who, message]) => {
			when += 4 * 60 * 1000;
			return {
				senderId: who === "demo" ? demo._id : contact._id,
				receiverId: who === "demo" ? contact._id : demo._id,
				message,
				createdAt: new Date(when),
				updatedAt: new Date(when),
			};
		});

		// timestamps:false so our explicit createdAt survives the insert.
		const saved = await Message.insertMany(docs, { timestamps: false });
		await Conversation.create({
			participants: [demo._id, contact._id],
			messages: saved.map((m) => m._id),
		});
		seeded += saved.length;
		console.log(`  seeded ${saved.length} messages with ${fullName}`);
	}
	console.log(`Done — ${seeded} messages across ${Object.keys(THREADS).length} threads.`);

	await mongoose.disconnect();
};

run().catch(async (err) => {
	console.error("Failed to seed demo user:", err.message);
	await mongoose.disconnect();
	process.exit(1);
});
