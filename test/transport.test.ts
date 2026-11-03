import { describe, expect, it } from 'vitest';

import {
	hotmartApiRequest,
	hotmartApiRequestAllItems,
	toHotmartError,
} from '../nodes/Hotmart/shared/transport';
import { fakeContext, fakeNode, httpError } from './helpers';

describe('toHotmartError', () => {
	it('toHotmartError puts reset seconds in 429 message', () => {
		const error = toHotmartError(
			fakeNode,
			httpError(429, { error: 'too_many_requests' }, { 'ratelimit-reset': '42' }),
		);
		expect(error.message).toContain('Try again in 42s');
	});

	it('toHotmartError keeps Hotmart message', () => {
		const error = toHotmartError(fakeNode, httpError(400, { message: 'Invalid coupon code' }));
		expect(error.message).toContain('Invalid coupon code');
	});

	it('toHotmartError keeps OAuth error_description', () => {
		const error = toHotmartError(
			fakeNode,
			httpError(401, { error: 'invalid_token', error_description: 'Access token expired' }),
		);
		expect(error.message).toContain('Access token expired');
	});
});

describe('hotmartApiRequest', () => {
	it('hotmartApiRequest uses sandbox base url', async () => {
		const { context, requests } = fakeContext(() => ({ ok: true }), 'sandbox');
		await hotmartApiRequest.call(context, 'GET', '/user/api/v1/me');
		expect(requests[0].url).toBe('https://sandbox.hotmart.com/user/api/v1/me');
	});

	it('sends array filters as repeated query params', async () => {
		const { context, requests } = fakeContext(() => ({}));
		await hotmartApiRequest.call(context, 'GET', '/x', { status: ['ACTIVE', 'DELAYED'] });
		expect(requests[0].arrayFormat).toBe('repeat');
	});

	it('cleans the query string', async () => {
		const { context, requests } = fakeContext(() => ({}));
		await hotmartApiRequest.call(context, 'GET', '/x', { a: 1, b: '', c: undefined });
		expect(requests[0].qs).toEqual({ a: 1 });
	});

	it('wraps HTTP errors as NodeApiError with the Hotmart message', async () => {
		const { context } = fakeContext(() => {
			throw httpError(404, { message: 'Product not found' });
		});
		await expect(hotmartApiRequest.call(context, 'GET', '/x')).rejects.toThrow('Product not found');
	});
});

describe('hotmartApiRequestAllItems', () => {
	it('hotmartApiRequestAllItems reads items and next_page_token', async () => {
		const { context, requests } = fakeContext((options) =>
			options.qs?.page_token === undefined
				? { items: [{ id: 1 }], page_info: { next_page_token: 'abc' } }
				: { items: [{ id: 2 }], page_info: {} },
		);
		const items = await hotmartApiRequestAllItems.call(context, 'GET', '/products/api/v1/products', {}, {
			returnAll: true,
			limit: 50,
		});
		expect(items).toEqual([{ id: 1 }, { id: 2 }]);
		expect(requests[0].qs).toEqual({ max_results: 100 });
		expect(requests[1].qs).toEqual({ max_results: 100, page_token: 'abc' });
	});

	it('asks only for what the limit needs', async () => {
		const { context, requests } = fakeContext(() => ({ items: [{ id: 1 }, { id: 2 }], page_info: {} }));
		await hotmartApiRequestAllItems.call(context, 'GET', '/x', {}, { returnAll: false, limit: 2 });
		expect(requests[0].qs).toEqual({ max_results: 2 });
	});
});
