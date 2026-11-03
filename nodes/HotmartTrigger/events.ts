/** Webhook v2.0.0 events documented by Hotmart (Nov 2026). */
export const HOTMART_EVENTS: ReadonlyArray<{ name: string; value: string }> = [
	{ name: 'Purchase Approved', value: 'PURCHASE_APPROVED' },
	{ name: 'Purchase Complete', value: 'PURCHASE_COMPLETE' },
	{ name: 'Purchase Canceled', value: 'PURCHASE_CANCELED' },
	{ name: 'Purchase Billet Printed', value: 'PURCHASE_BILLET_PRINTED' },
	{ name: 'Purchase Protest', value: 'PURCHASE_PROTEST' },
	{ name: 'Purchase Refunded', value: 'PURCHASE_REFUNDED' },
	{ name: 'Purchase Chargeback', value: 'PURCHASE_CHARGEBACK' },
	{ name: 'Purchase Expired', value: 'PURCHASE_EXPIRED' },
	{ name: 'Purchase Delayed', value: 'PURCHASE_DELAYED' },
	{ name: 'Cart Abandonment', value: 'PURCHASE_OUT_OF_SHOPPING_CART' },
	{ name: 'Subscription Cancellation', value: 'SUBSCRIPTION_CANCELLATION' },
	{ name: 'Switch Plan', value: 'SWITCH_PLAN' },
	{ name: 'Update Subscription Charge Date', value: 'UPDATE_SUBSCRIPTION_CHARGE_DATE' },
	{ name: 'Members Area First Access', value: 'CLUB_FIRST_ACCESS' },
	{ name: 'Members Area Module Completed', value: 'CLUB_MODULE_COMPLETED' },
	{ name: 'Order Fulfillment', value: 'ORDER_FULFILLMENT' },
];

/** True when no hottok is configured, or when the received header matches it exactly. */
export function checkHottok(expected: string | undefined, received: string | string[] | undefined): boolean {
	if (!expected) return true;
	const value = Array.isArray(received) ? received[0] : received;
	return value === expected;
}

/** An empty selection means "every event"; a payload without an event never triggers. */
export function shouldTrigger(selected: string[], event: unknown): boolean {
	if (typeof event !== 'string' || event.length === 0) return false;
	return selected.length === 0 || selected.includes(event);
}
