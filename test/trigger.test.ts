import { describe, expect, it } from 'vitest';

import { checkHottok, HOTMART_EVENTS, shouldTrigger } from '../nodes/HotmartTrigger/events';

describe('HOTMART_EVENTS', () => {
	it('lists the 16 webhook v2 events', () => {
		expect(HOTMART_EVENTS).toHaveLength(16);
		expect(HOTMART_EVENTS.map((e) => e.value)).toContain('ORDER_FULFILLMENT');
		expect(new Set(HOTMART_EVENTS.map((e) => e.value)).size).toBe(16);
	});
});

describe('checkHottok', () => {
	it('checkHottok accepts anything when not configured', () => {
		expect(checkHottok(undefined, undefined)).toBe(true);
		expect(checkHottok('', 'whatever')).toBe(true);
	});

	it('checkHottok rejects missing header', () => {
		expect(checkHottok('abc', undefined)).toBe(false);
	});

	it('checkHottok rejects wrong value', () => {
		expect(checkHottok('abc', 'abd')).toBe(false);
	});

	it('checkHottok accepts header array', () => {
		expect(checkHottok('abc', ['abc'])).toBe(true);
	});
});

describe('shouldTrigger', () => {
	it('shouldTrigger with empty selection needs an event', () => {
		expect(shouldTrigger([], 'PURCHASE_APPROVED')).toBe(true);
		expect(shouldTrigger([], undefined)).toBe(false);
		expect(shouldTrigger([], '')).toBe(false);
	});

	it('shouldTrigger filters', () => {
		expect(shouldTrigger(['PURCHASE_APPROVED'], 'PURCHASE_REFUNDED')).toBe(false);
		expect(shouldTrigger(['PURCHASE_APPROVED'], 'PURCHASE_APPROVED')).toBe(true);
	});
});
