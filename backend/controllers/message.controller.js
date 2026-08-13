import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import {
	generateAIReply,
	isAIConfigured,
	notConfiguredMessage,
} from "../services/ai.service.js";

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		const newMessage = new Message({
			senderId,
			receiverId,
			message,
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// await conversation.save();
		// await newMessage.save();

		// this will run in parallel
		await Promise.all([conversation.save(), newMessage.save()]);

		// SOCKET IO FUNCTIONALITY WILL GO HERE
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		// Respond to the sender first so the UI isn't blocked on the model call,
		// then generate the AI reply in the background if this is the AI friend.
		res.status(201).json(newMessage);

		const receiver = await User.findById(receiverId).select("isAI").lean();
		if (receiver?.isAI) {
			replyAsAI({ conversation, aiUserId: receiverId, humanId: senderId });
		}
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * Generate and deliver the AI friend's reply. Runs after the HTTP response has
 * been sent, so it must never throw into the request cycle — any failure is
 * delivered to the user as a chat message instead.
 */
const replyAsAI = async ({ conversation, aiUserId, humanId }) => {
	const deliver = async (text) => {
		const aiMessage = new Message({
			senderId: aiUserId,
			receiverId: humanId,
			message: text,
		});

		conversation.messages.push(aiMessage._id);
		await Promise.all([conversation.save(), aiMessage.save()]);

		const humanSocketId = getReceiverSocketId(humanId);
		if (humanSocketId) {
			io.to(humanSocketId).emit("newMessage", aiMessage);
		}
	};

	try {
		if (!(await isAIConfigured())) {
			await deliver(notConfiguredMessage());
			return;
		}

		const reply = await generateAIReply(conversation, aiUserId);
		await deliver(reply);
	} catch (error) {
		console.log("Error generating AI reply: ", error.message);
		try {
			await deliver("Something went wrong on my end — try me again in a sec.");
		} catch (deliverError) {
			console.log("Error delivering AI fallback: ", deliverError.message);
		}
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!conversation) return res.status(200).json([]);

		const messages = conversation.messages;

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};