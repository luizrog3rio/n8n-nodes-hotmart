import type { HotmartOperation } from '../../shared/types';
import { getProductId, productPicker } from '../../shared/descriptions';
import { hotmartApiRequest } from '../../shared/transport';

export const updateEmailSettings: HotmartOperation = {
	description: [
		productPicker('product', 'updateEmailSettings'),
		{
			displayName: 'Allow Hotmart Emails to Buyer',
			name: 'allowHotmartEmails',
			type: 'boolean',
			default: true,
			description: 'Whether Hotmart sends its transactional emails to buyers of this product',
			displayOptions: { show: { resource: ['product'], operation: ['updateEmailSettings'] } },
		},
	],
	async execute(i) {
		const productId = getProductId.call(this, i);
		const allowed = this.getNodeParameter('allowHotmartEmails', i) as boolean;
		await hotmartApiRequest.call(this, 'PUT', `/products/api/v1/product/configuration/${productId}`, {}, {
			is_allowed_to_email_the_buyer: allowed,
		});
		return { productId, isAllowedToEmailTheBuyer: allowed };
	},
};
