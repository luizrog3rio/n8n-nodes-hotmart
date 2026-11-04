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
	it('defaults start_date to one day ago: Hotmart reads "now" as Brasília wall time and the coupon stays "soon" for 3 hours', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(Date.UTC(2026, 10, 3, 19, 0));
		try {
			const { context, requests } = couponContext({ productId: 8584651, code: 'X', discountPercent: 90 });
			await create.execute.call(context, 0);
			expect((requests[0].body as IDataObject).start_date).toBe(Date.UTC(2026, 10, 2, 19, 0));
		} finally {
			vi.useRealTimers();
		}
	});

	it('sends a chosen start date as wall-clock time, the way Hotmart reads it', async () => {
		const { context, requests } = couponContext({
			productId: 8584651,
			code: 'X',
			discountPercent: 90,
			options: { startDate: '2026-12-01T10:00:00' },
		});
		await create.execute.call(context, 0);
		expect((requests[0].body as IDataObject).start_date).toBe(Date.UTC(2026, 11, 1, 10));
	});

	it('sends a date-only end date as the end of that day in wall-clock time', async () => {
		const { context, requests } = couponContext({
			productId: 8584651,
			code: 'X',
			discountPercent: 90,
			options: { endDate: '2026-12-31' },
		});
		await create.execute.call(context, 0);
		expect((requests[0].body as IDataObject).end_date).toBe(Date.UTC(2027, 0, 1) - 1);
	});

	it('leaves end_date out when no end date is given (coupon without expiry)', async () => {
		const { context, requests } = couponContext({ productId: 8584651, code: 'X', discountPercent: 90 });
		await create.execute.call(context, 0);
		expect(requests[0].body as IDataObject).not.toHaveProperty('end_date');
	});
});
