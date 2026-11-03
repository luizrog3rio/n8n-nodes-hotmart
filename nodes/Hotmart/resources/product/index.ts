import { buildResource } from '../../shared/types';
import { getMany } from './getMany';
import { getOffers } from './getOffers';
import { getPlans } from './getPlans';
import { updateEmailSettings } from './updateEmailSettings';

export const product = buildResource(
	'product',
	[
		{ name: 'Get Many', value: 'getMany', action: 'Get many products', description: 'List the products of the account', operation: getMany },
		{ name: 'Get Offers', value: 'getOffers', action: 'Get the offers of a product', description: 'List the offers (prices and payment links) of a product', operation: getOffers },
		{ name: 'Get Plans', value: 'getPlans', action: 'Get the plans of a product', description: 'List the subscription plans of a product', operation: getPlans },
		{ name: 'Update Email Settings', value: 'updateEmailSettings', action: 'Update the email settings of a product', description: 'Turn Hotmart transactional emails to buyers on or off', operation: updateEmailSettings },
	],
	'getMany',
);
