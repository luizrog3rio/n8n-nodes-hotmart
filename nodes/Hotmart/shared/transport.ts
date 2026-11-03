import {
	NodeApiError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type ILoadOptionsFunctions,
	type INode,
	type JsonObject,
} from 'n8n-workflow';

import { paginate } from './pagination';
import { cleanQuery, getBaseUrl, type HotmartEnvironment } from './utils';

type Context = IExecuteFunctions | ILoadOptionsFunctions;

interface HttpErrorLike {
	message?: string;
	httpCode?: string;
	response?: { status?: number; statusCode?: number; data?: unknown; body?: unknown; headers?: IDataObject };
	cause?: HttpErrorLike;
}

function readHeader(headers: IDataObject | undefined, name: string): string | undefined {
	if (!headers) return undefined;
	const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
	return key === undefined ? undefined : String(headers[key]);
}

/** Turns any HTTP failure into a NodeApiError that carries Hotmart's own message. */
export function toHotmartError(node: INode, error: unknown): NodeApiError {
	const err = (error ?? {}) as HttpErrorLike;
	const response = err.response ?? err.cause?.response;
	const status = response?.status ?? response?.statusCode ?? Number(err.httpCode ?? err.cause?.httpCode);
	const body = (response?.data ?? response?.body ?? {}) as IDataObject;

	let message: string;
	if (status === 429) {
		const reset = readHeader(response?.headers, 'ratelimit-reset');
		message = `Hotmart rate limit reached (500 requests/minute).${reset ? ` Try again in ${reset}s.` : ''}`;
	} else {
		const hotmartMessage = [body.message, body.error_description, body.error].find(
			(v) => typeof v === 'string' && v.length > 0,
		) as string | undefined;
		message = hotmartMessage ?? err.message ?? 'Unknown error from the Hotmart API';
	}

	return new NodeApiError(node, (Object.keys(body).length ? body : { message }) as JsonObject, {
		message,
		httpCode: status ? String(status) : undefined,
	});
}

export async function hotmartApiRequest(
	this: Context,
	method: IHttpRequestMethods,
	path: string,
	qs: IDataObject = {},
	body?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('hotmartApi');
	const options: IHttpRequestOptions = {
		method,
		url: `${getBaseUrl(credentials.environment as HotmartEnvironment)}${path}`,
		qs: cleanQuery(qs),
		arrayFormat: 'repeat',
		json: true,
	};
	if (body !== undefined) options.body = body;

	try {
		return ((await this.helpers.httpRequestWithAuthentication.call(this, 'hotmartApi', options)) ??
			{}) as IDataObject;
	} catch (error) {
		throw toHotmartError(this.getNode(), error);
	}
}

export async function hotmartApiRequestAllItems(
	this: Context,
	method: IHttpRequestMethods,
	path: string,
	qs: IDataObject,
	opts: { returnAll: boolean; limit: number },
): Promise<IDataObject[]> {
	const maxResults = opts.returnAll ? 100 : Math.min(opts.limit, 100);
	return await paginate(async (pageToken) => {
		const response = await hotmartApiRequest.call(this, method, path, {
			...qs,
			max_results: maxResults,
			page_token: pageToken,
		});
		const pageInfo = (response.page_info ?? {}) as IDataObject;
		return {
			items: (response.items ?? []) as IDataObject[],
			nextPageToken: (pageInfo.next_page_token as string | undefined) || undefined,
		};
	}, opts);
}
