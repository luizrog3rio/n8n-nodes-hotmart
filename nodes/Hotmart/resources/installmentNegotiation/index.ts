import { NodeOperationError } from 'n8n-workflow';

import { hotmartApiRequest } from '../../shared/transport';
import { buildResource, type HotmartOperation } from '../../shared/types';
import { buildNegotiationBody } from './body';

const show = { resource: ['installmentNegotiation'], operation: ['generate'] };

const generate: HotmartOperation = {
	description: [
		{
			displayName: 'Subscription ID',
			name: 'subscriptionId',
			type: 'number',
			default: 0,
			required: true,
			displayOptions: { show },
		},
		{
			displayName: 'Recurrences',
			name: 'recurrences',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. 3, 4',
			description:
				'Overdue recurrence numbers to negotiate (1 to 5), separated by commas. Subscriptions with Members Area content can only negotiate the last one.',
			displayOptions: { show },
		},
		{
			displayName: 'Payment Type',
			name: 'paymentType',
			type: 'options',
			options: [
				{ name: 'Billet', value: 'BILLET' },
				{ name: 'Cash Payment', value: 'CASH_PAYMENT' },
				{ name: 'PIX', value: 'PIX' },
			],
			default: 'PIX',
			displayOptions: { show },
		},
		{
			displayName: 'Document (CPF/CNPJ)',
			name: 'document',
			type: 'string',
			default: '',
			description: 'Required for billet',
			displayOptions: { show },
		},
		{
			displayName: 'Discount Value',
			name: 'discountValue',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Custom discount on the negotiated amount. 0 = no discount.',
			displayOptions: { show },
		},
	],
	async execute(i) {
		let body;
		try {
			body = buildNegotiationBody({
				subscriptionId: this.getNodeParameter('subscriptionId', i) as number,
				recurrences: this.getNodeParameter('recurrences', i) as string,
				paymentType: this.getNodeParameter('paymentType', i) as string,
				discountValue: this.getNodeParameter('discountValue', i) as number,
				document: this.getNodeParameter('document', i) as string,
			});
		} catch (error) {
			throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex: i });
		}
		return await hotmartApiRequest.call(this, 'POST', '/payments/api/v1/installments/negotiate', {}, body);
	},
};

export const installmentNegotiation = buildResource(
	'installmentNegotiation',
	[
		{
			name: 'Generate',
			value: 'generate',
			action: 'Generate an installment negotiation',
			description: 'Generate a billet, PIX or cash payment for overdue subscription recurrences',
			operation: generate,
		},
	],
	'generate',
);
