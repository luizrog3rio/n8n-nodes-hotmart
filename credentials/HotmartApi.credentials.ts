import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

const TOKEN_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';

export class HotmartApi implements ICredentialType {
	name = 'hotmartApi';

	displayName = 'Hotmart API';

	icon: Icon = { light: 'file:../icons/hotmart.svg', dark: 'file:../icons/hotmart.dark.svg' };

	documentationUrl = 'https://developers.hotmart.com/docs/en/start/app-auth/';

	properties: INodeProperties[] = [
		{
			displayName:
				'Create the credentials in Hotmart → Tools → Hotmart Credentials. The keys are shown only once, right after creation. If you restrict Allowed HTTP Request Domains, allow both hosts separated by a comma: developers.hotmart.com,api-sec-vlc.hotmart.com (sandbox: sandbox.hotmart.com,api-sec-vlc.hotmart.com).',
			name: 'notice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Sandbox', value: 'sandbox' },
			],
			default: 'production',
			description:
				'Must match the type chosen when the credential was created in Hotmart (sandbox credentials only work in sandbox)',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Basic Token',
			name: 'basicToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'Basic MGIw...',
			description: 'Paste the whole "Basic" token exactly as Hotmart shows it, including the "Basic " prefix',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'hidden',
			typeOptions: { expirable: true, password: true },
			default: '',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const basic = String(credentials.basicToken).trim();
		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: TOKEN_URL,
			qs: {
				grant_type: 'client_credentials',
				client_id: String(credentials.clientId).trim(),
				client_secret: String(credentials.clientSecret).trim(),
			},
			headers: {
				Authorization: basic.toLowerCase().startsWith('basic ') ? basic : `Basic ${basic}`,
				'Content-Type': 'application/json',
			},
			json: true,
		})) as { access_token: string };
		return { accessToken: response.access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "sandbox" ? "https://sandbox.hotmart.com" : "https://developers.hotmart.com"}}',
			// /user/api/v1/me is 404 on sandbox; the product list answers on both environments.
			url: '/products/api/v1/products',
			qs: { max_results: 1 },
			method: 'GET',
		},
	};
}
