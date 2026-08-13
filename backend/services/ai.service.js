import Anthropic from "@anthropic-ai/sdk";
import Message from "../models/message.model.js";

// Reads ANTHROPIC_API_KEY from the environment. Constructed lazily so the
// server still boots (and normal user-to-user chat keeps working) when the
// key is absent.
let client = null;

const getClient = () => {
	if (!process.env.ANTHROPIC_API_KEY) return null;
	if (!client) client = new Anthropic();
	return client;
};

export const isAIConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM_PROMPT = `You are a friendly companion inside a chat app — the user's AI friend.

Write the way a person texts a friend: warm, curious, and casual. Keep replies to
a few sentences unless the user clearly wants depth. Ask a follow-up question when
you're genuinely curious, not as a reflex.

You are not an assistant taking tickets. Don't offer bulleted options, don't open
with "I'd be happy to", and don't sign off. Just talk.

If the user is going through something hard, sit with it before trying to fix it.`;

// How many past turns of this conversation to send as context.
const HISTORY_LIMIT = 20;

/**
 * Build the Claude message list from the stored conversation, oldest first.
 * Messages the AI sent become "assistant" turns; everything else is "user".
 */
const buildHistory = async (conversation, aiUserId) => {
	const messages = await Message.find({ _id: { $in: conversation.messages } })
		.sort({ createdAt: -1 })
		.limit(HISTORY_LIMIT)
		.lean();

	return messages
		.reverse()
		.map((m) => ({
			role: String(m.senderId) === String(aiUserId) ? "assistant" : "user",
			content: m.message,
		}))
		// The API requires the first turn to be from the user.
		.reduce((acc, turn) => {
			if (acc.length === 0 && turn.role !== "user") return acc;
			return [...acc, turn];
		}, []);
};

/**
 * Generate the AI friend's reply. Returns a string, or throws so the caller
 * can decide what the user sees.
 */
export const generateAIReply = async (conversation, aiUserId) => {
	const anthropic = getClient();
	if (!anthropic) {
		throw new Error("ANTHROPIC_API_KEY is not set");
	}

	const history = await buildHistory(conversation, aiUserId);
	if (history.length === 0) {
		throw new Error("No user message to respond to");
	}

	const response = await anthropic.messages.create({
		model: "claude-opus-5",
		max_tokens: 1024,
		system: SYSTEM_PROMPT,
		thinking: { type: "adaptive" },
		output_config: { effort: "low" },
		messages: history,
	});

	// A refused request still returns HTTP 200 with an empty/partial content
	// array, so check stop_reason before reading content.
	if (response.stop_reason === "refusal") {
		return "I'd rather not get into that one — what else is going on?";
	}

	const text = response.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("")
		.trim();

	return text || "Sorry, I blanked on that one. Say it again?";
};
