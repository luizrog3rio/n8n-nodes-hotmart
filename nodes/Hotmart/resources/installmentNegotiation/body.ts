import type { IDataObject } from 'n8n-workflow';

import { splitList } from '../../shared/descriptions';

export interface NegotiationInput {
	subscriptionId: number;
	recurrences: string;
	paymentType: string;
	discountValue: number;
	document: string;
}

/** Validates the negotiation before calling Hotmart, so mistakes fail with a clear message. */
export function buildNegotiationBody(input: NegotiationInput): IDataObject {
	const parts = splitList(input.recurrences);
	const recurrences = parts.map(Number);
	if (recurrences.some((r) => !Number.isInteger(r) || r < 1)) {
		throw new Error('Recurrences must be whole numbers separated by commas, e.g. "1, 2"');
	}
	if (recurrences.length < 1 || recurrences.length > 5) {
		throw new Error('Choose between 1 and 5 recurrences to negotiate');
	}

	const document = input.document.trim();
	if (input.paymentType === 'BILLET' && !document) {
		throw new Error('Document (CPF/CNPJ) is required for billet negotiations');
	}

	const body: IDataObject = {
		subscription_id: input.subscriptionId,
		recurrences,
		payment_type: input.paymentType,
	};
	if (input.discountValue > 0) body.discount = { type: 'CUSTOM', value: input.discountValue };
	if (document) body.document = document;
	return body;
}
