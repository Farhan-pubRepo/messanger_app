/* eslint-disable react/prop-types */
import { useState } from "react";

/**
 * Avatar with a local fallback.
 *
 * Tries the user's profilePic; if there isn't one — or the image fails to load,
 * which is what happens when an external avatar host goes down — it draws
 * initials on a colour derived from the name. No network required.
 */

// Picked to stay readable against white text.
const COLORS = [
	"#0ea5e9", // sky
	"#8b5cf6", // violet
	"#ec4899", // pink
	"#f97316", // orange
	"#10b981", // emerald
	"#eab308", // yellow
	"#ef4444", // red
	"#14b8a6", // teal
	"#6366f1", // indigo
];

// Same name always lands on the same colour.
const colorFor = (seed = "") => {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = seed.charCodeAt(i) + ((hash << 5) - hash);
	}
	return COLORS[Math.abs(hash) % COLORS.length];
};

const initialsFor = (name = "") => {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "?";
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const Avatar = ({ src, name, className = "w-12" }) => {
	const [failed, setFailed] = useState(false);
	const showFallback = !src || failed;

	return (
		<div className={`${className} rounded-full overflow-hidden`}>
			{showFallback ? (
				<div
					className='w-full h-full flex items-center justify-center text-white font-semibold select-none'
					style={{ backgroundColor: colorFor(name), fontSize: "0.9em" }}
					aria-label={name}
				>
					{initialsFor(name)}
				</div>
			) : (
				<img
					src={src}
					alt={name}
					className='w-full h-full object-cover'
					onError={() => setFailed(true)}
				/>
			)}
		</div>
	);
};

export default Avatar;
