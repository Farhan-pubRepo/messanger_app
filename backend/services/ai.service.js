import Anthropic from "@anthropic-ai/sdk";
import Message from "../models/message.model.js";

/**
 * Aria can run on either provider, chosen with AI_PROVIDER in .env:
 *
 *   ollama    (default) - a model running locally. Free, offline, no API key.
 *   anthropic           - the Claude API. Needs ANTHROPIC_API_KEY and credits.
 *
 * Switching is a one-line change in .env; nothing else in the app cares.
 */
const PROVIDER = (process.env.AI_PROVIDER || "ollama").toLowerCase();

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

let anthropicClient = null;
const getAnthropic = () => {
	if (!process.env.ANTHROPIC_API_KEY) return null;
	if (!anthropicClient) anthropicClient = new Anthropic();
	return anthropicClient;
};

const SYSTEM_PROMPT = `You are a friendly companion inside a chat app — the user's AI friend.

Write the way a person texts a friend: warm, curious, and casual. Keep replies to
a few sentences unless the user clearly wants depth. Ask a follow-up question when
you're genuinely curious, not as a reflex.

You are not an assistant taking tickets. Don't offer bulleted options, don't open
with "I'd be happy to", and don't sign off. Just talk.

If the user is going through something hard, sit with it before trying to fix it.`;

// How many past turns of this conversation to send as context.
const HISTORY_LIMIT = 20;

/** True when the selected provider is actually usable right now. */
export const isAIConfigured = async () => {
	if (PROVIDER === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY);

	// Ollama: the server has to be running locally.
	try {
		const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
			signal: AbortSignal.timeout(2000),
		});
		return res.ok;
	} catch {
		return false;
	}
};

/** Human-readable reason the provider isn't available, shown in the chat. */
export const notConfiguredMessage = () =>
	PROVIDER === "anthropic"
		? "I'm not connected yet — add ANTHROPIC_API_KEY to the backend .env and restart the server."
		: "I'm not connected yet — start my local model with `ollama serve` in a terminal, then message me again.";

/**
 * Build the provider-neutral message list from the stored conversation, oldest
 * first. Both providers accept this same {role, content} shape.
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
		// Both APIs require the first turn to come from the user.
		.reduce((acc, turn) => {
			if (acc.length === 0 && turn.role !== "user") return acc;
			return [...acc, turn];
		}, []);
};

const replyViaOllama = async (history) => {
	const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: OLLAMA_MODEL,
			stream: false,
			messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
			options: { temperature: 0.8 },
		}),
		// Local generation is fast, but a cold model load can take a while.
		signal: AbortSignal.timeout(120000),
	});

	if (!res.ok) {
		throw new Error(`Ollama returned ${res.status}`);
	}

	const data = await res.json();
	return (data?.message?.content || "").trim();
};

const replyViaAnthropic = async (history) => {
	const anthropic = getAnthropic();
	if (!anthropic) throw new Error("ANTHROPIC_API_KEY is not set");

	const response = await anthropic.messages.create({
		model: ANTHROPIC_MODEL,
		max_tokens: 1024,
		system: SYSTEM_PROMPT,
		thinking: { type: "adaptive" },
		output_config: { effort: "low" },
		messages: history,
	});

	// A refused request still returns HTTP 200 with empty/partial content, so
	// check stop_reason before reading content.
	if (response.stop_reason === "refusal") {
		return "I'd rather not get into that one — what else is going on?";
	}

	return response.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("")
		.trim();
};

/**
 * Generate the AI friend's reply. Returns a string, or throws so the caller
 * can decide what the user sees.
 */
export const generateAIReply = async (conversation, aiUserId) => {
	const history = await buildHistory(conversation, aiUserId);
	if (history.length === 0) {
		throw new Error("No user message to respond to");
	}

	const text =
		PROVIDER === "anthropic"
			? await replyViaAnthropic(history)
			: await replyViaOllama(history);

	return text || "Sorry, I blanked on that one. Say it again?";
};
