import { buildResource } from '../../shared/types';
import { create } from './create';
import { deleteCoupon } from './delete';
import { getMany } from './getMany';

export const coupon = buildResource(
	'coupon',
	[
		{ name: 'Create', value: 'create', action: 'Create a coupon', description: 'Create a discount coupon for a product (not available for subscription products)', operation: create },
		{ name: 'Delete', value: 'delete', action: 'Delete a coupon', description: 'Delete a coupon by its ID', operation: deleteCoupon },
		{ name: 'Get Many', value: 'getMany', action: 'Get many coupons', description: 'List the coupons of a product', operation: getMany },
	],
	'create',
);
