import { describe, expect, it } from 'vitest';
import type { IExecuteFunctions } from 'n8n-workflow';

import { getProductId } from '../nodes/Hotmart/shared/descriptions';
import { create } from '../nodes/Hotmart/resources/coupon/create';
import { sale } from '../nodes/Hotmart/resources/sale';
import { fakeNode } from './helpers';

const withProduct = (value: unknown) =>
	({ getNode: () => fakeNode, getNodeParameter: () => value }) as unknown as IExecuteFunctions;

describe('getProductId', () => {
	it('returns the numeric id', () => {
		expect(getProductId.call(withProduct('8584651'), 0)).toBe(8584651);
	});

	it('rejects empty or non numeric product ids', () => {
		for (const bad of ['', undefined, 'abc', '12.5', '-3']) {
			expect(() => getProductId.call(withProduct(bad), 0)).toThrow('Choose a product');
		}
	});
});

describe('coupon discount field', () => {
	it('does not clamp the value in the UI, so percentToFraction can reject it', () => {
		const field = create.description.find((p) => p.name === 'discountPercent');
		expect(field?.typeOptions?.minValue).toBeUndefined();
		expect(field?.typeOptions?.maxValue).toBeUndefined();
	});
});

describe('sale lists', () => {
	it('show the APPROVED/COMPLETE default as a visible hint', () => {
		const filters = sale.description.filter((p) => p.name === 'filters');
		expect(filters.length).toBeGreaterThan(0);
		for (const f of filters) expect(f.hint).toContain('APPROVED and COMPLETE');
	});
});
