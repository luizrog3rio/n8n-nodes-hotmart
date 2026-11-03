import { describe, expect, it } from 'vitest';

import { resolveProductUcode } from '../nodes/Hotmart/shared/product';
import { fakeContext } from './helpers';

describe('resolveProductUcode', () => {
	it('resolveProductUcode returns ucode', async () => {
		const { context, requests } = fakeContext(() => ({
			items: [{ id: 8584651, ucode: '88829f20-f89e-4254-8093-1fee8f7724be' }],
		}));
		expect(await resolveProductUcode.call(context, 8584651)).toBe(
			'88829f20-f89e-4254-8093-1fee8f7724be',
		);
		expect(requests[0].url).toBe('https://developers.hotmart.com/products/api/v1/products');
		expect(requests[0].qs).toEqual({ id: 8584651 });
	});

	it('resolveProductUcode throws clear error when not found', async () => {
		const { context } = fakeContext(() => ({ items: [] }));
		await expect(resolveProductUcode.call(context, 123)).rejects.toThrow(
			'Product 123 not found in this Hotmart account',
		);
	});
});

describe('resolveProductUcode safety', () => {
	it('rejects a product whose id does not match the requested one', async () => {
		const { context } = fakeContext(() => ({ items: [{ id: 999, ucode: 'other-product' }] }));
		await expect(resolveProductUcode.call(context, 123)).rejects.toThrow(
			'Product 123 not found in this Hotmart account',
		);
	});
});
