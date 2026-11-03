import { buildResource } from '../../shared/types';
import { getMe } from './getMe';

export const account = buildResource(
	'account',
	[
		{
			name: 'Get Me',
			value: 'getMe',
			action: 'Get the authenticated account',
			description: 'Get the profile of the account that owns the credentials',
			operation: getMe,
		},
	],
	'getMe',
);
