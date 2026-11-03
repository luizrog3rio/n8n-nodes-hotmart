import {
	NodeConnectionTypes,
	type ICredentialsDecrypted,
	type ICredentialTestFunctions,
	type IDataObject,
	type IHookFunctions,
	type INodeCredentialTestResult,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

import { checkHottok, HOTMART_EVENTS, loadExpectedHottok, shouldTrigger } from './events';

export class HotmartTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hotmart Trigger',
		name: 'hotmartTrigger',
		icon: { light: 'file:../../icons/hotmart.svg', dark: 'file:../../icons/hotmart.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].length ? $parameter["events"].join(", ") : "All events"}}',
		description: 'Starts the workflow when Hotmart sends a webhook (purchases, subscriptions, members area)',
		defaults: { name: 'Hotmart Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'hotmartWebhookApi', required: false, testedBy: 'hotmartWebhookApiTest' }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Copy the Production URL above and paste it in Hotmart → Tools → Webhook. Hotmart does not allow registering webhooks automatically. Choose payload version 2.0.0.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [...HOTMART_EVENTS],
				default: [],
				description: 'Events that start the workflow. Leave empty to accept every event.',
			},
		],
	};

	methods = {
		credentialTest: {
			// Hotmart has no endpoint that validates a hottok, so only its shape can be checked.
			async hotmartWebhookApiTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const hottok = String(credential.data?.hottok ?? '').trim();
				if (hottok.length < 10 || /\s/.test(hottok)) {
					return { status: 'Error', message: 'The hottok looks wrong: copy it again from Hotmart → Tools → Webhook' };
				}
				return { status: 'OK', message: 'Hottok saved. Hotmart cannot validate it remotely; send a test webhook to confirm.' };
			},
		},
	};

	// Hotmart only lets producers register webhooks by hand in its dashboard, so there is
	// nothing to create or delete remotely: the user pastes the Production URL there.
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		let expectedHottok: string | undefined;
		try {
			expectedHottok = await loadExpectedHottok(
				Boolean(this.getNode().credentials?.hotmartWebhookApi),
				async () => (await this.getCredentials('hotmartWebhookApi')).hottok as string | undefined,
			);
		} catch {
			this.getResponseObject().status(500).send('Could not read the Hotmart Webhook credential');
			return { noWebhookResponse: true };
		}

		const headers = this.getHeaderData() as IDataObject;
		if (!checkHottok(expectedHottok, headers['x-hotmart-hottok'] as string | string[] | undefined)) {
			const res = this.getResponseObject();
			res.status(401).send('Invalid hottok');
			return { noWebhookResponse: true };
		}

		const body = this.getBodyData();
		const events = this.getNodeParameter('events', []) as string[];
		if (!shouldTrigger(events, body.event)) {
			return { webhookResponse: 'ignored' };
		}

		return { workflowData: [this.helpers.returnJsonArray(body)] };
	}
}
