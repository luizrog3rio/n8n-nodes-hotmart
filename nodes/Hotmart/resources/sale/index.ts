import { listOperation } from '../../shared/listOperation';
import { buildResource } from '../../shared/types';
import { base, f, STATUS_HINT } from './filters';
import { generateNewBillet, refund } from './writes';

const list = (operation: string, path: string, extra: typeof base) =>
	listOperation({
		resource: 'sale',
		operation,
		path: `/payments/api/v1/sales/${path}`,
		filters: [...base, ...extra],
		hint: STATUS_HINT,
	});

export const sale = buildResource(
	'sale',
	[
		{
			name: 'Generate New Billet', value: 'generateNewBillet', action: 'Generate a new billet for a sale',
			description: 'Issue a new boleto for a sale and get its URL', operation: generateNewBillet,
		},
		{
			name: 'Get Commissions', value: 'getCommissions', action: 'Get sale commissions',
			description: 'Commission of each participant in the sales',
			operation: list('getCommissions', 'commissions', [f.commissionAs]),
		},
		{
			name: 'Get History', value: 'getHistory', action: 'Get the sales history',
			description: 'List sales with buyer, product, offer and payment details',
			operation: list('getHistory', 'history', [f.buyerName, f.buyerEmail, f.paymentType, f.offerCode, f.salesSource, f.commissionAs]),
		},
		{
			name: 'Get Participants', value: 'getParticipants', action: 'Get sale participants',
			description: 'Buyer, producer, affiliates and co-producers of the sales',
			operation: list('getParticipants', 'users', [f.buyerEmail, f.buyerName, f.salesSource, f.affiliateName, f.commissionAs]),
		},
		{
			name: 'Get Price Details', value: 'getPriceDetails', action: 'Get sale price details',
			description: 'Price, fees, coupon and conversion details of the sales',
			operation: list('getPriceDetails', 'price/details', [f.paymentType]),
		},
		{
			name: 'Get Summary', value: 'getSummary', action: 'Get the sales summary',
			description: 'Total commissions per currency',
			operation: list('getSummary', 'summary', [f.affiliateName, f.paymentType, f.offerCode, f.salesSource]),
		},
		{
			name: 'Refund', value: 'refund', action: 'Refund a sale',
			description: 'Request the refund of an approved or complete sale', operation: refund,
		},
	],
	'getHistory',
);
