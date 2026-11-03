import { describe, expect, it } from 'vitest';

import {
	cleanQuery,
	getBaseUrl,
	percentToFraction,
	toEpochMs,
} from '../nodes/Hotmart/shared/utils';

describe('getBaseUrl', () => {
	it('returns production and sandbox hosts', () => {
		expect(getBaseUrl('production')).toBe('https://developers.hotmart.com');
		expect(getBaseUrl('sandbox')).toBe('https://sandbox.hotmart.com');
	});
});

describe('toEpochMs', () => {
	it('toEpochMs date-only uses timezone', () => {
		expect(toEpochMs('2026-11-01', 'America/Sao_Paulo')).toBe(Date.UTC(2026, 10, 1, 3));
	});

	it('toEpochMs keeps explicit offset', () => {
		expect(toEpochMs('2026-11-01T10:00:00Z', 'America/Sao_Paulo')).toBe(Date.UTC(2026, 10, 1, 10));
	});

	it('toEpochMs reads local datetime without offset in the timezone', () => {
		expect(toEpochMs('2026-11-01T10:00:00', 'America/Sao_Paulo')).toBe(Date.UTC(2026, 10, 1, 13));
	});

	it('passes numbers through and ignores empty values', () => {
		expect(toEpochMs(1730419200000, 'UTC')).toBe(1730419200000);
		expect(toEpochMs(undefined, 'UTC')).toBeUndefined();
		expect(toEpochMs('', 'UTC')).toBeUndefined();
	});

	it('throws on garbage', () => {
		expect(() => toEpochMs('ontem', 'UTC')).toThrow('Invalid date');
	});
});

describe('percentToFraction', () => {
	it('converts whole percentages', () => {
		expect(percentToFraction(90)).toBe(0.9);
		expect(percentToFraction(1)).toBe(0.01);
		expect(percentToFraction(99)).toBe(0.99);
	});

	it('percentToFraction rejects out of range and fractions', () => {
		for (const bad of [0, 100, 150, 0.9, -5, NaN]) {
			expect(() => percentToFraction(bad)).toThrow('between 1 and 99');
		}
	});
});

describe('cleanQuery', () => {
	it('drops empty values and keeps false and filled arrays', () => {
		expect(cleanQuery({ a: 1, b: '', c: undefined, d: [], e: null, f: ['x'], g: false })).toEqual({
			a: 1,
			f: ['x'],
			g: false,
		});
	});
});
