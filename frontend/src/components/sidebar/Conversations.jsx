import useGetConversations from "../../hooks/useGetConversations";
import useConversation from "../../zustand/useConversation";
import { getEmojiForSeed } from "../../utils/emojis";
import { matchesSearch } from "../../utils/searchConversations";
import Conversation from "./Conversation";

const Conversations = () => {
	const { loading, conversations } = useGetConversations();
	const { search } = useConversation();

	const visible = conversations.filter((c) => matchesSearch(c, search));

	return (
		<div className='py-2 flex flex-col overflow-auto'>
			{visible.map((conversation, idx) => (
				<Conversation
					key={conversation._id}
					conversation={conversation}
					emoji={getEmojiForSeed(conversation._id)}
					lastIdx={idx === visible.length - 1}
				/>
			))}

			{!loading && search.trim() && visible.length === 0 ? (
				<p className='text-center text-sm text-gray-400 py-4'>
					No one matches “{search.trim()}”
				</p>
			) : null}

			{loading ? <span className='loading loading-spinner mx-auto'></span> : null}
		</div>
	);
};
export default Conversations;

// STARTER CODE SNIPPET
// import Conversation from "./Conversation";

// const Conversations = () => {
// 	return (
// 		<div className='py-2 flex flex-col overflow-auto'>
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 			<Conversation />
// 		</div>
// 	);
// };
// export default Conversations;