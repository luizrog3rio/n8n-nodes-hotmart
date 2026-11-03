import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeProperties,
} from 'n8n-workflow';

import { splitList } from '../../shared/descriptions';
import { hotmartApiRequest } from '../../shared/transport';
import type { HotmartOperation } from '../../shared/types';

const BASE = '/payments/api/v1/subscriptions';

function field(
	operation: string,
	displayName: string,
	name: string,
	type: 'string' | 'boolean' | 'number',
	extra: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName,
		name,
		type,
		default: type === 'boolean' ? false : type === 'number' ? 0 : '',
		displayOptions: { show: { resource: ['subscription'], operation: [operation] } },
		...extra,
	};
}

const subscriberCodeField = (operation: string) =>
	field(operation, 'Subscriber Code', 'subscriberCode', 'string', { required: true });

const subscriberCodesField = (operation: string, required = true) =>
	field(operation, 'Subscriber Codes', 'subscriberCodes', 'string', {
		required,
		placeholder: 'e.g. ABC123, DEF456',
		description: 'Subscriber codes, separated by commas',
	});

function getSubscriberCode(this: IExecuteFunctions, i: number): string {
	return String(this.getNodeParameter('subscriberCode', i)).trim();
}

function getSubscriberCodes(this: IExecuteFunctions, i: number): string[] {
	const list = splitList(this.getNodeParameter('subscriberCodes', i));
	if (list.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Enter at least one subscriber code', { itemIndex: i });
	}
	return list;
}

const itemsOf = (response: IDataObject) => (response.items as IDataObject[] | undefined) ?? response;

export const getPurchases: HotmartOperation = {
	description: [subscriberCodeField('getPurchases')],
	async execute(i) {
		const code = encodeURIComponent(getSubscriberCode.call(this, i));
		return itemsOf(await hotmartApiRequest.call(this, 'GET', `${BASE}/${code}/purchases`));
	},
};

export const cancel: HotmartOperation = {
	description: [
		subscriberCodeField('cancel'),
		field('cancel', 'Send Email', 'sendEmail', 'boolean', {
			default: true,
			description: 'Whether Hotmart emails the subscriber about the cancellation',
		}),
	],
	async execute(i) {
		const code = getSubscriberCode.call(this, i);
		const response = await hotmartApiRequest.call(
			this,
			'POST',
			`${BASE}/${encodeURIComponent(code)}/cancel`,
			{},
			{ send_mail: this.getNodeParameter('sendEmail', i) as boolean },
		);
		return { subscriberCode: code, ...response };
	},
};

export const cancelMany: HotmartOperation = {
	description: [
		subscriberCodesField('cancelMany'),
		field('cancelMany', 'Send Email', 'sendEmail', 'boolean', {
			default: true,
			description: 'Whether Hotmart emails the subscribers about the cancellation',
		}),
	],
	async execute(i) {
		return await hotmartApiRequest.call(
			this,
			'POST',
			`${BASE}/cancel`,
			{},
			{
				subscriber_code: getSubscriberCodes.call(this, i),
				send_mail: this.getNodeParameter('sendEmail', i) as boolean,
			},
		);
	},
};

export const reactivate: HotmartOperation = {
	description: [
		subscriberCodeField('reactivate'),
		field('reactivate', 'Charge Now', 'chargeNow', 'boolean', {
			description: 'Whether to charge the subscriber immediately on reactivation',
		}),
	],
	async execute(i) {
		const code = getSubscriberCode.call(this, i);
		const response = await hotmartApiRequest.call(
			this,
			'POST',
			`${BASE}/${encodeURIComponent(code)}/reactivate`,
			{},
			{ charge: this.getNodeParameter('chargeNow', i) as boolean },
		);
		return { subscriberCode: code, ...response };
	},
};

export const reactivateMany: HotmartOperation = {
	description: [
		subscriberCodesField('reactivateMany'),
		field('reactivateMany', 'Charge Now', 'chargeNow', 'boolean', {
			description: 'Whether to charge the subscribers immediately on reactivation',
		}),
	],
	async execute(i) {
		return await hotmartApiRequest.call(
			this,
			'POST',
			`${BASE}/reactivate`,
			{},
			{
				subscriber_code: getSubscriberCodes.call(this, i),
				charge: this.getNodeParameter('chargeNow', i) as boolean,
			},
		);
	},
};

export const changeDueDay: HotmartOperation = {
	description: [
		subscriberCodeField('changeDueDay'),
		field('changeDueDay', 'Due Day', 'dueDay', 'number', {
			default: 10,
			required: true,
			typeOptions: { minValue: 1, maxValue: 31 },
			description: 'New day of the month for the charge',
		}),
	],
	async execute(i) {
		const code = getSubscriberCode.call(this, i);
		const dueDay = this.getNodeParameter('dueDay', i) as number;
		const response = await hotmartApiRequest.call(
			this,
			'PATCH',
			`${BASE}/${encodeURIComponent(code)}`,
			{},
			{ due_day: dueDay },
		);
		return { subscriberCode: code, dueDay, ...response };
	},
};

export const getSwitchPlanOptions: HotmartOperation = {
	description: [
		subscriberCodesField('getSwitchPlanOptions', false),
		field('getSwitchPlanOptions', 'Product ID', 'productId', 'number'),
		field('getSwitchPlanOptions', 'Offer Codes', 'offerCodes', 'string', {
			placeholder: 'e.g. 7gbr9vwq, n82b9jqz',
			description: 'Offer codes, separated by commas',
		}),
	],
	async execute(i) {
		const productId = this.getNodeParameter('productId', i) as number;
		return itemsOf(
			await hotmartApiRequest.call(this, 'GET', `${BASE}/switch-plan/plans`, {
				subscriber_codes: splitList(this.getNodeParameter('subscriberCodes', i)),
				product_id: productId || undefined,
				offer_codes: splitList(this.getNodeParameter('offerCodes', i)),
			}),
		);
	},
};

export const switchPlan: HotmartOperation = {
	description: [
		subscriberCodeField('switchPlan'),
		field('switchPlan', 'Offer Code', 'offerCode', 'string', {
			required: true,
			description: 'Offer code of the plan to switch to (see Get Switch Plan Options)',
		}),
	],
	async execute(i) {
		const code = getSubscriberCode.call(this, i);
		const offerCode = String(this.getNodeParameter('offerCode', i)).trim();
		const response = await hotmartApiRequest.call(
			this,
			'POST',
			`${BASE}/switch-plan`,
			{},
			{ subscriber_code: code, offer_code: offerCode },
		);
		return { subscriberCode: code, offerCode, ...response };
	},
};
