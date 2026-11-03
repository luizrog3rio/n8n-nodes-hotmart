import type { IDataObject } from 'n8n-workflow';

export type FetchPage = (
	pageToken?: string,
) => Promise<{ items: IDataObject[]; nextPageToken?: string }>;

/**
 * Walks Hotmart's cursor pagination. Stops when the token is missing, when the API
 * repeats a token it already sent (guards against infinite loops) or when `limit` is reached.
 */
export async function paginate(
	fetchPage: FetchPage,
	opts: { returnAll: boolean; limit: number },
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	const seen = new Set<string>();
	let token: string | undefined;

	do {
		const page = await fetchPage(token);
		results.push(...page.items);
		if (!opts.returnAll && results.length >= opts.limit) return results.slice(0, opts.limit);
		if (page.items.length === 0) break;

		token = page.nextPageToken;
		if (token !== undefined) {
			if (seen.has(token)) break;
			seen.add(token);
		}
	} while (token);

	return results;
}
