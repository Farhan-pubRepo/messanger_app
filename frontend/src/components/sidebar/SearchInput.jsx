import { IoSearchSharp } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import useGetConversations from "../../hooks/useGetConversations";
import { matchesSearch } from "../../utils/searchConversations";

/**
 * Filters the sidebar as you type. Submitting (Enter or the button) opens the
 * first match, so the keyboard path still works without touching the mouse.
 */
const SearchInput = () => {
	const { search, setSearch, setSelectedConversation } = useConversation();
	const { conversations } = useGetConversations();

	const handleSubmit = (e) => {
		e.preventDefault();
		const first = conversations.find((c) => matchesSearch(c, search));
		if (first) {
			setSelectedConversation(first);
			setSearch("");
		}
	};

	return (
		<form onSubmit={handleSubmit} className='flex items-center gap-2'>
			<label className='relative flex-1'>
				<input
					type='text'
					placeholder='Search…'
					className='input input-bordered rounded-full w-full pr-9'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					aria-label='Search people'
				/>
				{search && (
					<button
						type='button'
						onClick={() => setSearch("")}
						className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'
						aria-label='Clear search'
					>
						<IoClose className='w-5 h-5' />
					</button>
				)}
			</label>
			<button type='submit' className='btn btn-circle bg-sky-500 text-white' aria-label='Search'>
				<IoSearchSharp className='w-6 h-6 outline-none' />
			</button>
		</form>
	);
};
export default SearchInput;
