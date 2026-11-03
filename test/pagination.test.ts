import { describe, expect, it } from 'vitest';
import type { IDataObject } from 'n8n-workflow';

import { paginate } from '../nodes/Hotmart/shared/pagination';

type Page = { items: IDataObject[]; nextPageToken?: string };

function fakeApi(pages: Page[]) {
	const calls: Array<string | undefined> = [];
	const fetchPage = async (pageToken?: string): Promise<Page> => {
		calls.push(pageToken);
		const index = pageToken === undefined ? 0 : Number(pageToken.replace('t', ''));
		return pages[index] ?? { items: [] };
	};
	return { fetchPage, calls };
}

describe('paginate', () => {
	it('paginate returnAll follows tokens until missing', async () => {
		const api = fakeApi([
			{ items: [{ id: 1 }, { id: 2 }], nextPageToken: 't1' },
			{ items: [{ id: 3 }, { id: 4 }], nextPageToken: 't2' },
			{ items: [{ id: 5 }, { id: 6 }] },
		]);
		const result = await paginate(api.fetchPage, { returnAll: true, limit: 50 });
		expect(result.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(api.calls).toEqual([undefined, 't1', 't2']);
	});

	it('paginate respects limit and stops early', async () => {
		const api = fakeApi([
			{ items: [{ id: 1 }, { id: 2 }], nextPageToken: 't1' },
			{ items: [{ id: 3 }, { id: 4 }], nextPageToken: 't2' },
			{ items: [{ id: 5 }] },
		]);
		const result = await paginate(api.fetchPage, { returnAll: false, limit: 3 });
		expect(result.map((r) => r.id)).toEqual([1, 2, 3]);
		expect(api.calls).toHaveLength(2);
	});

	it('paginate stops on repeated token', async () => {
		const calls: Array<string | undefined> = [];
		const fetchPage = async (pageToken?: string): Promise<Page> => {
			calls.push(pageToken);
			return { items: [{ id: calls.length }], nextPageToken: 'same' };
		};
		const result = await paginate(fetchPage, { returnAll: true, limit: 50 });
		expect(calls).toEqual([undefined, 'same']);
		expect(result).toHaveLength(2);
	});

	it('paginate returns [] when first page is empty', async () => {
		const api = fakeApi([{ items: [], nextPageToken: 't1' }]);
		expect(await paginate(api.fetchPage, { returnAll: true, limit: 50 })).toEqual([]);
		expect(api.calls).toHaveLength(1);
	});
});
