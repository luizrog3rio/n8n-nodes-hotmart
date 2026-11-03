import type { HotmartOperation } from '../../shared/types';
import { hotmartApiRequest } from '../../shared/transport';

export const deleteCoupon: HotmartOperation = {
	description: [
		{
			displayName: 'Coupon ID',
			name: 'couponId',
			type: 'number',
			default: 0,
			required: true,
			description: 'Numeric ID of the coupon (from Coupon → Get Many)',
			displayOptions: { show: { resource: ['coupon'], operation: ['delete'] } },
		},
	],
	async execute(i) {
		const couponId = this.getNodeParameter('couponId', i) as number;
		await hotmartApiRequest.call(this, 'DELETE', `/products/api/v1/coupon/${couponId}`);
		return { deleted: true, couponId };
	},
};
