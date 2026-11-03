import { describe, expect, it } from 'vitest';

import { Hotmart } from '../nodes/Hotmart/Hotmart.node';
import { HotmartTrigger } from '../nodes/HotmartTrigger/HotmartTrigger.node';

// n8n stores installed community nodes keyed by display name, so reusing the names of the
// older n8n-nodes-hotmart package ("Hotmart", "Hotmart Trigger") makes installing both fail
// with "duplicate key value violates unique constraint".
const OLDER_PACKAGE_NAMES = ['Hotmart', 'Hotmart Trigger'];

describe('node display names', () => {
	it('do not clash with the older n8n-nodes-hotmart package', () => {
		const names = [new Hotmart().description.displayName, new HotmartTrigger().description.displayName];
		expect(names).toEqual(['Hotmart API', 'Hotmart API Trigger']);
		for (const name of names) expect(OLDER_PACKAGE_NAMES).not.toContain(name);
	});
});
