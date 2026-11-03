import type { HotmartOperation } from '../../shared/types';
import { getFilters, getPaginationOptions, returnAllAndLimit } from '../../shared/descriptions';
import { hotmartApiRequestAllItems } from '../../shared/transport';

const STATUS = ['DRAFT', 'ACTIVE', 'PAUSED', 'NOT_APPROVED', 'IN_REVIEW', 'DELETED', 'CHANGES_PENDING_ON_PRODUCT'];
const FORMAT = [
	'EBOOK', 'SOFTWARE', 'MOBILE_APPS', 'VIDEOS', 'AUDIOS', 'TEMPLATES', 'IMAGES', 'ONLINE_COURSE',
	'SERIAL_CODES', 'ETICKET', 'ONLINE_SERVICE', 'ONLINE_EVENT', 'BUNDLE', 'COMMUNITY', 'AGENT',
];
const toOptions = (values: string[]) => values.map((v) => ({ name: v, value: v }));

export const getMany: HotmartOperation = {
	description: [
		...returnAllAndLimit('product', 'getMany'),
		{
			displayName: 'Filters',
			name: 'filters',
			type: 'collection',
			placeholder: 'Add Filter',
			default: {},
			displayOptions: { show: { resource: ['product'], operation: ['getMany'] } },
			options: [
				{ displayName: 'Product ID', name: 'id', type: 'number', default: 0 },
				{ displayName: 'Status', name: 'status', type: 'options', options: toOptions(STATUS), default: 'ACTIVE' },
				{ displayName: 'Format', name: 'format', type: 'options', options: toOptions(FORMAT), default: 'ONLINE_COURSE' },
			],
		},
	],
	async execute(i) {
		const filters = getFilters.call(this, i);
		return await hotmartApiRequestAllItems.call(
			this,
			'GET',
			'/products/api/v1/products',
			{ id: filters.id || undefined, status: filters.status, format: filters.format },
			getPaginationOptions.call(this, i),
		);
	},
};
