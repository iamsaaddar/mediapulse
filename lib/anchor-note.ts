import { MAX_TASTE_LIST_ITEMS } from "@/constants/limits";
import type { TasteProfile } from "@/types/taste";

/** Keep the user's explicit explanation visible even if a Gemini update omits it. */
export function preserveAnchorNote(profile: TasteProfile, anchorNote: string): TasteProfile {
	const note = anchorNote.trim();
	if (!note) return profile;

	const otherLikes = profile.likes.filter((like) => like !== note);
	return { ...profile, likes: [note, ...otherLikes].slice(0, MAX_TASTE_LIST_ITEMS) };
}
