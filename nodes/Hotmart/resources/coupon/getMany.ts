import type { HotmartOperation } from '../../shared/types';
import { getPaginationOptions, getProductId, productPicker, returnAllAndLimit } from '../../shared/descriptions';
import { hotmartApiRequestAllItems } from '../../shared/transport';

export const getMany: HotmartOperation = {
	description: [
		productPicker('coupon', 'getMany'),
		...returnAllAndLimit('coupon', 'getMany'),
		{
			displayName: 'Code',
			name: 'code',
			type: 'string',
			default: '',
			description: 'Only return the coupon with this code',
			displayOptions: { show: { resource: ['coupon'], operation: ['getMany'] } },
		},
	],
	async execute(i) {
		const productId = getProductId.call(this, i);
		return await hotmartApiRequestAllItems.call(
			this,
			'GET',
			`/products/api/v1/coupon/product/${productId}`,
			{ code: this.getNodeParameter('code', i, '') },
			getPaginationOptions.call(this, i),
		);
	},
};
