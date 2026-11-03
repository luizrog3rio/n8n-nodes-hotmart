import type { HotmartOperation } from '../../shared/types';
import { getPaginationOptions, getProductId, productPicker, returnAllAndLimit } from '../../shared/descriptions';
import { resolveProductUcode } from '../../shared/product';
import { hotmartApiRequestAllItems } from '../../shared/transport';

export const getOffers: HotmartOperation = {
	description: [productPicker('product', 'getOffers'), ...returnAllAndLimit('product', 'getOffers')],
	async execute(i) {
		const ucode = await resolveProductUcode.call(this, getProductId.call(this, i) as number);
		return await hotmartApiRequestAllItems.call(
			this,
			'GET',
			`/products/api/v1/products/${ucode}/offers`,
			{},
			getPaginationOptions.call(this, i),
		);
	},
};
