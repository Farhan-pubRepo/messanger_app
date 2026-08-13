/**
 * Shared matcher so the input and the list can't drift apart on what counts
 * as a hit. Matches full name or username, case-insensitively.
 */
export const matchesSearch = (conversation, search) => {
	const term = search.trim().toLowerCase();
	if (!term) return true;

	const fullName = (conversation.fullName || "").toLowerCase();
	const username = (conversation.username || "").toLowerCase();

	return fullName.includes(term) || username.includes(term);
};
