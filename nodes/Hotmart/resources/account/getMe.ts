import type { HotmartOperation } from '../../shared/types';
import { hotmartApiRequest } from '../../shared/transport';

export const getMe: HotmartOperation = {
	description: [],
	async execute() {
		return await hotmartApiRequest.call(this, 'GET', '/user/api/v1/me');
	},
};
