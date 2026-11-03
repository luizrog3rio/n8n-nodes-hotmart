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

/** True when no hottok is configured, or when the received header matches it (ignoring surrounding spaces). */
export function checkHottok(expected: string | undefined, received: string | string[] | undefined): boolean {
	const wanted = expected?.trim();
	if (!wanted) return true;
	const value = Array.isArray(received) ? received[0] : received;
	return value?.trim() === wanted;
}

/**
 * Hottok to validate against. No credential on the node → undefined (accept all, as documented).
 * A credential that is set but unreadable or empty must fail closed, never accept everything.
 */
export async function loadExpectedHottok(
	hasCredential: boolean,
	load: () => Promise<string | undefined>,
): Promise<string | undefined> {
	if (!hasCredential) return undefined;
	const hottok = (await load())?.trim();
	if (!hottok) throw new Error('The Hotmart Webhook credential has an empty hottok');
	return hottok;
}

/** An empty selection means "every event"; a payload without an event never triggers. */
export function shouldTrigger(selected: string[], event: unknown): boolean {
	if (typeof event !== 'string' || event.length === 0) return false;
	return selected.length === 0 || selected.includes(event);
}
