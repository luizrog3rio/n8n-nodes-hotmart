import { describe, expect, it } from 'vitest';

import { buildNegotiationBody } from '../nodes/Hotmart/resources/installmentNegotiation/body';

describe('buildNegotiationBody', () => {
	it('builds the body for a PIX negotiation with discount', () => {
		expect(
			buildNegotiationBody({
				subscriptionId: 123,
				recurrences: '1, 2',
				paymentType: 'PIX',
				discountValue: 10,
				document: '',
			}),
		).toEqual({
			subscription_id: 123,
			recurrences: [1, 2],
			payment_type: 'PIX',
			discount: { type: 'CUSTOM', value: 10 },
		});
	});

	it('requires a document for billet', () => {
		expect(() =>
			buildNegotiationBody({ subscriptionId: 1, recurrences: '1', paymentType: 'BILLET', discountValue: 0, document: '' }),
		).toThrow('Document (CPF/CNPJ) is required for billet');
	});

	it('keeps the document for billet', () => {
		expect(
			buildNegotiationBody({
				subscriptionId: 1,
				recurrences: '3',
				paymentType: 'BILLET',
				discountValue: 0,
				document: '12345678909',
			}),
		).toEqual({ subscription_id: 1, recurrences: [3], payment_type: 'BILLET', document: '12345678909' });
	});

	it('rejects zero or more than five recurrences', () => {
		const base = { subscriptionId: 1, paymentType: 'PIX', discountValue: 0, document: '' };
		expect(() => buildNegotiationBody({ ...base, recurrences: '' })).toThrow('between 1 and 5 recurrences');
		expect(() => buildNegotiationBody({ ...base, recurrences: '1,2,3,4,5,6' })).toThrow(
			'between 1 and 5 recurrences',
		);
	});

	it('rejects recurrences that are not positive whole numbers', () => {
		expect(() =>
			buildNegotiationBody({ subscriptionId: 1, recurrences: '1, dois', paymentType: 'PIX', discountValue: 0, document: '' }),
		).toThrow('Recurrences must be whole numbers');
	});
});
