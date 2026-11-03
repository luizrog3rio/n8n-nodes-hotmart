import { buildResource } from '../../shared/types';
import {
	cancel,
	cancelMany,
	changeDueDay,
	getPurchases,
	getSwitchPlanOptions,
	reactivate,
	reactivateMany,
	switchPlan,
} from './actions';
import { getMany, getSummary, getTransactions } from './lists';

export const subscription = buildResource(
	'subscription',
	[
		{ name: 'Cancel', value: 'cancel', action: 'Cancel a subscription', description: 'Cancel one subscription', operation: cancel },
		{ name: 'Cancel Many', value: 'cancelMany', action: 'Cancel many subscriptions', description: 'Cancel several subscriptions at once', operation: cancelMany },
		{ name: 'Change Due Day', value: 'changeDueDay', action: 'Change the due day of a subscription', description: 'Change the day of the month the subscriber is charged', operation: changeDueDay },
		{ name: 'Get Many', value: 'getMany', action: 'Get many subscriptions', description: 'List subscriptions in real time', operation: getMany },
		{ name: 'Get Purchases', value: 'getPurchases', action: 'Get the purchases of a subscriber', description: 'List the charges (recurrences) of one subscriber', operation: getPurchases },
		{ name: 'Get Summary', value: 'getSummary', action: 'Get the subscriptions summary', description: 'Financial situation of subscriptions, Smart Installments and Smart Recovery', operation: getSummary },
		{ name: 'Get Switch Plan Options', value: 'getSwitchPlanOptions', action: 'Get the plans a subscriber can switch to', description: 'List the plans available for a plan switch', operation: getSwitchPlanOptions },
		{ name: 'Get Transactions', value: 'getTransactions', action: 'Get subscription transactions', description: 'Transactions of subscriptions, Smart Installments and Smart Recovery', operation: getTransactions },
		{ name: 'Reactivate', value: 'reactivate', action: 'Reactivate a subscription', description: 'Reactivate one subscription, optionally charging it', operation: reactivate },
		{ name: 'Reactivate Many', value: 'reactivateMany', action: 'Reactivate many subscriptions', description: 'Reactivate several subscriptions at once', operation: reactivateMany },
		{ name: 'Switch Plan', value: 'switchPlan', action: 'Switch the plan of a subscription', description: 'Move a subscriber to another plan (offer)', operation: switchPlan },
	],
	'getMany',
);
