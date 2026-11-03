import type { IDataObject } from 'n8n-workflow';

export type HotmartEnvironment = 'production' | 'sandbox';

export function getBaseUrl(environment: HotmartEnvironment): string {
	return environment === 'sandbox' ? 'https://sandbox.hotmart.com' : 'https://developers.hotmart.com';
}

/** Milliseconds the timezone is ahead of UTC at the given instant. */
function timezoneOffsetMs(timestamp: number, timezone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).formatToParts(new Date(timestamp));
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
	const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
	return asUtc - Math.floor(timestamp / 1000) * 1000;
}

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;

/**
 * Converts a date to epoch milliseconds, as the Hotmart API expects.
 * Dates without an offset ("2026-11-01" or "2026-11-01T10:00:00") are read in `timezone`.
 * With `endOfDay`, a date without a time (or at midnight, as the n8n date picker sends it)
 * means the last millisecond of that day, so "until 2026-11-30" still includes the 30th.
 */
export function toEpochMs(
	value: string | number | undefined,
	timezone: string,
	opts: { endOfDay?: boolean } = {},
): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	if (typeof value === 'number') return value;

	const local = LOCAL_DATE_TIME.exec(value.trim());
	if (local) {
		const [, y, mo, d, h, mi = '0', s = '0'] = local;
		const midnight = h === undefined || (+h === 0 && +mi === 0 && +s === 0);
		if (opts.endOfDay && midnight) {
			const nextDayStart = toEpochMs(
				new Date(Date.UTC(+y, +mo - 1, +d + 1)).toISOString().slice(0, 10),
				timezone,
			) as number;
			return nextDayStart - 1;
		}
		const wall = Date.UTC(+y, +mo - 1, +d, +(h ?? 0), +mi, +s);
		let result = wall - timezoneOffsetMs(wall, timezone);
		const corrected = wall - timezoneOffsetMs(result, timezone);
		if (corrected !== result) result = corrected;
		return result;
	}

	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) throw new Error(`Invalid date: "${value}"`);
	return parsed;
}

/** Hotmart expects the coupon discount as a fraction; the node asks for a whole percentage. */
export function percentToFraction(percent: number): number {
	if (!Number.isInteger(percent) || percent < 1 || percent > 99) {
		throw new Error('Discount must be a whole percentage between 1 and 99');
	}
	return percent / 100;
}

export function cleanQuery(qs: IDataObject): IDataObject {
	const clean: IDataObject = {};
	for (const [key, value] of Object.entries(qs)) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value) && value.length === 0) continue;
		clean[key] = value;
	}
	return clean;
}
