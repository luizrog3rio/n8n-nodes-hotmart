import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';

import { create } from '../nodes/Hotmart/resources/coupon/create';
import { fakeContext } from './helpers';

function couponContext(params: IDataObject) {
	const { context, requests } = fakeContext(() => ({ id: 1 }));
	Object.assign(context, {
		getNodeParameter: (name: string, _i: number, fallback?: unknown) => params[name] ?? fallback,
		getTimezone: () => 'America/Sao_Paulo',
	});
	return { context: context as IExecuteFunctions, requests };
}

describe('coupon create', () => {
	it('sends start_date = now when no start date is given (Hotmart rejects coupons without it)', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(Date.UTC(2026, 10, 3, 19, 0));
		try {
			const { context, requests } = couponContext({ productId: 8584651, code: 'X', discountPercent: 90 });
			await create.execute.call(context, 0);
			expect((requests[0].body as IDataObject).start_date).toBe(Date.UTC(2026, 10, 3, 19, 0));
		} finally {
			vi.useRealTimers();
		}
	});

	it('keeps a start date the user chose', async () => {
		const { context, requests } = couponContext({
			productId: 8584651,
			code: 'X',
			discountPercent: 90,
			options: { startDate: '2026-12-01' },
		});
		await create.execute.call(context, 0);
		expect((requests[0].body as IDataObject).start_date).toBe(Date.UTC(2026, 11, 1, 3));
	});
});
