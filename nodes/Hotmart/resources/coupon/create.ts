import { NodeOperationError, type IDataObject } from 'n8n-workflow';

import type { HotmartOperation } from '../../shared/types';
import { getProductId, productPicker, splitList } from '../../shared/descriptions';
import { hotmartApiRequest } from '../../shared/transport';
import { percentToFraction, toEpochMs } from '../../shared/utils';

const show = { resource: ['coupon'], operation: ['create'] };

export const create: HotmartOperation = {
	description: [
		productPicker('coupon', 'create'),
		{
			displayName: 'Code',
			name: 'code',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'e.g. BLACKFRIDAY',
			description: 'Coupon code buyers type at checkout (max 25 characters)',
			displayOptions: { show },
		},
		{
			displayName: 'Discount (%)',
			name: 'discountPercent',
			type: 'number',
			default: 10,
			required: true,
			hint: 'Whole percentage from 1 to 99: 90 = 90% off',
			displayOptions: { show },
		},
		{
			displayName: 'Options',
			name: 'options',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: { show },
			options: [
				{ displayName: 'Start Date', name: 'startDate', type: 'dateTime', default: '' },
				{ displayName: 'End Date', name: 'endDate', type: 'dateTime', default: '' },
				{
					displayName: 'Affiliate ID',
					name: 'affiliateId',
					type: 'number',
					default: 0,
					description: 'Restrict the coupon to one affiliate',
				},
				{
					displayName: 'Offer IDs',
					name: 'offerIds',
					type: 'string',
					default: '',
					placeholder: 'e.g. 123456, 789012',
					description: 'Numeric offer IDs the coupon applies to, comma-separated. Get Offers only returns offer codes, not these IDs: copy the ID from the offer in the Hotmart dashboard. Empty = every offer of the product, including higher-priced ones.',
				},
			],
		},
	],
	async execute(i) {
		const productId = getProductId.call(this, i);
		const code = String(this.getNodeParameter('code', i)).trim();
		if (code.length === 0 || code.length > 25) {
			throw new NodeOperationError(this.getNode(), 'The coupon code must have between 1 and 25 characters', {
				itemIndex: i,
			});
		}

		let discount: number;
		try {
			discount = percentToFraction(this.getNodeParameter('discountPercent', i) as number);
		} catch (error) {
			throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex: i });
		}

		const options = this.getNodeParameter('options', i, {}) as IDataObject;
		const timezone = this.getTimezone();
		const offerIds = splitList(options.offerIds).map(Number);
		if (offerIds.some((id) => !Number.isInteger(id))) {
			throw new NodeOperationError(this.getNode(), 'Offer IDs must be numbers separated by commas', {
				itemIndex: i,
			});
		}

		const body: IDataObject = { code, discount };
		const startDate = toEpochMs(options.startDate as string, timezone);
		const endDate = toEpochMs(options.endDate as string, timezone, { endOfDay: true });
		if (startDate !== undefined) body.start_date = startDate;
		if (endDate !== undefined) body.end_date = endDate;
		if (options.affiliateId) body.affiliate = options.affiliateId;
		if (offerIds.length) body.offer_ids = offerIds;

		const response = await hotmartApiRequest.call(this, 'POST', `/products/api/v1/product/${productId}/coupon`, {}, body);
		return { ...response, productId, code, discount };
	},
};
