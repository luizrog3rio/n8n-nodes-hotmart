import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

type Show = { resource: string[]; operation: string[] };

const show = (resource: string, operation: string | string[]): Show => ({
	resource: [resource],
	operation: Array.isArray(operation) ? operation : [operation],
});

/** Product chooser: list from the account, or a numeric ID. */
export function productPicker(
	resource: string,
	operation: string | string[],
	options: { required?: boolean } = {},
): INodeProperties {
	return {
		displayName: 'Product',
		name: 'productId',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: options.required ?? true,
		displayOptions: { show: show(resource, operation) },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'getProducts', searchable: true },
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 8584651',
				validation: [
					{
						type: 'regex',
						properties: { regex: '^\\d+$', errorMessage: 'The product ID must be a number' },
					},
				],
			},
		],
	};
}

export function getProductId(this: IExecuteFunctions, i: number): number | undefined {
	const value = this.getNodeParameter('productId', i, '', { extractValue: true }) as string | number;
	return value === '' || value === undefined ? undefined : Number(value);
}

export function returnAllAndLimit(resource: string, operation: string | string[]): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show: show(resource, operation) },
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show(resource, operation), returnAll: [false] } },
		},
	];
}

export function getPaginationOptions(this: IExecuteFunctions, i: number) {
	const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
	const limit = returnAll ? 0 : (this.getNodeParameter('limit', i, 50) as number);
	return { returnAll, limit };
}

/** Comma separated text ("1, 2,3") → array of trimmed, non-empty values. */
export function splitList(value: unknown): string[] {
	return String(value ?? '')
		.split(',')
		.map((v) => v.trim())
		.filter((v) => v.length > 0);
}

export function getFilters(this: IExecuteFunctions, i: number): IDataObject {
	return this.getNodeParameter('filters', i, {}) as IDataObject;
}
