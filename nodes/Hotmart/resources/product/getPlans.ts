import type { HotmartOperation } from '../../shared/types';
import { getPaginationOptions, getProductId, productPicker, returnAllAndLimit } from '../../shared/descriptions';
import { resolveProductUcode } from '../../shared/product';
import { hotmartApiRequestAllItems } from '../../shared/transport';

export const getPlans: HotmartOperation = {
	description: [productPicker('product', 'getPlans'), ...returnAllAndLimit('product', 'getPlans')],
	async execute(i) {
		const ucode = await resolveProductUcode.call(this, getProductId.call(this, i) as number);
		return await hotmartApiRequestAllItems.call(
			this,
			'GET',
			`/products/api/v1/products/${ucode}/plans`,
			{},
			getPaginationOptions.call(this, i),
		);
	},
};
