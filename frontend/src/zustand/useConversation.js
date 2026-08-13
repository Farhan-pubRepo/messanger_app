import { create } from "zustand";

const useConversation = create((set) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
	messages: [],
	setMessages: (messages) => set({ messages }),
	// Lives here so the input and the list can share it: the input writes,
	// the list filters on it as you type.
	search: "",
	setSearch: (search) => set({ search }),
}));

export default useConversation;