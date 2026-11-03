import type { ICredentialType, Icon, INodeProperties } from 'n8n-workflow';

export class HotmartWebhookApi implements ICredentialType {
	name = 'hotmartWebhookApi';

	displayName = 'Hotmart Webhook API';

	icon: Icon = { light: 'file:../icons/hotmart.svg', dark: 'file:../icons/hotmart.dark.svg' };

	documentationUrl = 'https://developers.hotmart.com/docs/en/1.0.0/webhook/using-webhook/';

	properties: INodeProperties[] = [
		{
			displayName: 'Hottok',
			name: 'hottok',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your account hottok, shown in Hotmart → Tools → Webhook. Requests without this exact value in the X-HOTMART-HOTTOK header are rejected.',
		},
	];
}
