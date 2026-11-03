import type { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { hotmartApiRequest } from '../shared/transport';

export async function getProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const response = await hotmartApiRequest.call(this, 'GET', '/products/api/v1/products', {
		max_results: 50,
		page_token: paginationToken,
	});
	const search = (filter ?? '').toLowerCase();
	const results = ((response.items ?? []) as IDataObject[])
		.filter((p) => !search || String(p.name).toLowerCase().includes(search) || String(p.id).includes(search))
		.map((p) => ({ name: `${p.name} (${p.id})`, value: String(p.id) }));
	const pageInfo = (response.page_info ?? {}) as IDataObject;
	return { results, paginationToken: (pageInfo.next_page_token as string | undefined) || undefined };
}
