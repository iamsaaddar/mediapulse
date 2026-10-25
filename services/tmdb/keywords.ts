import { z } from "zod";
import { fetchTmdb } from "./client";

const KeywordResultSchema = z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(120) }).passthrough();

export interface ResolvedKeyword { id: number; name: string; query: string }

export async function searchTmdbKeywords(query: string): Promise<ResolvedKeyword[]> {
	const normalizedQuery = query.trim().slice(0, 80);
	if (!normalizedQuery) return [];
	const response = await fetchTmdb<{ results?: unknown[] }>("/search/keyword", { query: normalizedQuery, page: 1 });
	if (!Array.isArray(response.results)) return [];
	return response.results.flatMap((value) => {
		const parsed = KeywordResultSchema.safeParse(value);
		return parsed.success ? [{ ...parsed.data, query: normalizedQuery }] : [];
	});
}

/** Resolve a concept only when TMDB returns a direct, case-insensitive name match. */
export function chooseKeywordMatch(query: string, results: ResolvedKeyword[]): ResolvedKeyword | null {
	const normalized = query.trim().toLocaleLowerCase();
	if (!normalized) return null;
	return results.find((item) => item.name.trim().toLocaleLowerCase() === normalized) ?? null;
}
