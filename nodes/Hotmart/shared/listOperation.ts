import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { getFilters, getPaginationOptions, returnAllAndLimit, splitList } from './descriptions';
import { hotmartApiRequestAllItems } from './transport';
import type { HotmartOperation } from './types';
import { toEpochMs } from './utils';

/**
 * A filter of a list operation: the n8n field plus the Hotmart query parameter it maps to.
 * `kind: 'date'` converts to epoch ms; `kind: 'list'` splits "a, b" into an array.
 */
export interface ListFilter {
	field: INodeProperties;
	query: string;
	kind?: 'date' | 'list';
}

export function listOperation(options: {
	resource: string;
	operation: string;
	path: string;
	filters: ListFilter[];
	hint?: string;
}): HotmartOperation {
	const show = { resource: [options.resource], operation: [options.operation] };
	return {
		description: [
			...returnAllAndLimit(options.resource, options.operation),
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show },
				...(options.hint ? { hint: options.hint } : {}),
				options: options.filters.map((f) => f.field),
			},
		],
		async execute(i) {
			const filters = getFilters.call(this, i);
			const timezone = this.getTimezone();
			const qs: IDataObject = {};
			for (const { field, query, kind } of options.filters) {
				const value = filters[field.name];
				if (value === undefined || value === '' || value === 0) continue;
				if (kind === 'date') qs[query] = toEpochMs(value as string, timezone);
				else if (kind === 'list') qs[query] = Array.isArray(value) ? value : splitList(value);
				else qs[query] = value;
			}
			return await hotmartApiRequestAllItems.call(
				this,
				'GET',
				options.path,
				qs,
				getPaginationOptions.call(this, i),
			);
		},
	};
}

export const text = (displayName: string, name: string, description?: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	...(description ? { description } : {}),
});

export const number = (displayName: string, name: string, description?: string): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	...(description ? { description } : {}),
});

export const date = (displayName: string, name: string): INodeProperties => ({
	displayName,
	name,
	type: 'dateTime',
	default: '',
});

export const choice = (
	displayName: string,
	name: string,
	values: string[],
	description?: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'options',
	default: '',
	options: values.map((v) => ({ name: v, value: v })),
	...(description ? { description } : {}),
});
