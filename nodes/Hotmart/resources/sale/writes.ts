import type { HotmartOperation } from '../../shared/types';
import { hotmartApiRequest } from '../../shared/transport';

const transactionField = (operation: string) => ({
	displayName: 'Transaction',
	name: 'transaction',
	type: 'string' as const,
	default: '',
	required: true,
	placeholder: 'e.g. HP02316330308193',
	displayOptions: { show: { resource: ['sale'], operation: [operation] } },
});

export const refund: HotmartOperation = {
	description: [transactionField('refund')],
	async execute(i) {
		const transaction = String(this.getNodeParameter('transaction', i)).trim();
		await hotmartApiRequest.call(this, 'PUT', `/payments/api/v1/sales/${transaction}/refund`);
		return { refundRequested: true, transaction };
	},
};

export const generateNewBillet: HotmartOperation = {
	description: [transactionField('generateNewBillet')],
	async execute(i) {
		const transaction = String(this.getNodeParameter('transaction', i)).trim();
		const response = await hotmartApiRequest.call(this, 'PUT', `/payments/api/v1/sales/${transaction}/billet`);
		return { transaction, ...response };
	},
};
