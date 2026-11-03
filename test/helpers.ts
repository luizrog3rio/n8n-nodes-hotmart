import type { IDataObject, IExecuteFunctions, IHttpRequestOptions, INode } from 'n8n-workflow';

export const fakeNode: INode = {
	id: '1',
	name: 'Hotmart',
	type: '@luizrog3rio/n8n-nodes-hotmart.hotmart',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

/**
 * Minimal IExecuteFunctions for transport tests. `respond` returns the body for each request
 * (or throws to simulate an HTTP error); every request is recorded in `requests`.
 */
export function fakeContext(
	respond: (options: IHttpRequestOptions) => unknown,
	environment: 'production' | 'sandbox' = 'production',
) {
	const requests: IHttpRequestOptions[] = [];
	const context = {
		getNode: () => fakeNode,
		getCredentials: async () => ({ environment }) as IDataObject,
		helpers: {
			httpRequestWithAuthentication: async (_type: string, options: IHttpRequestOptions) => {
				requests.push(options);
				return respond(options);
			},
		},
	} as unknown as IExecuteFunctions;
	return { context, requests };
}

export function httpError(statusCode: number, body: IDataObject, headers: IDataObject = {}) {
	return Object.assign(new Error(`Request failed with status code ${statusCode}`), {
		httpCode: String(statusCode),
		response: { status: statusCode, statusCode, data: body, body, headers },
	});
}
