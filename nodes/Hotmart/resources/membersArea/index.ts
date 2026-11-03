import type { IDataObject, INodeProperties } from 'n8n-workflow';

import {
	getPaginationOptions,
	getProductId,
	productPicker,
	returnAllAndLimit,
} from '../../shared/descriptions';
import { hotmartApiRequest, hotmartApiRequestAllItems } from '../../shared/transport';
import { buildResource, type HotmartOperation } from '../../shared/types';

const show = (operation: string) => ({ show: { resource: ['membersArea'], operation: [operation] } });

const subdomain = (operation: string): INodeProperties => ({
	displayName: 'Subdomain',
	name: 'subdomain',
	type: 'string',
	default: '',
	required: true,
	placeholder: 'e.g. mycourse',
	description: 'Subdomain of the Members Area (the part before .club.hotmart.com)',
	displayOptions: show(operation),
});

const itemsOf = (response: IDataObject) => (response.items as IDataObject[] | undefined) ?? response;

const getModules: HotmartOperation = {
	description: [
		subdomain('getModules'),
		{
			displayName: 'Only Extra Modules',
			name: 'isExtra',
			type: 'boolean',
			default: false,
			description: 'Whether to return only extra modules',
			displayOptions: show('getModules'),
		},
	],
	async execute(i) {
		const isExtra = this.getNodeParameter('isExtra', i) as boolean;
		return itemsOf(
			await hotmartApiRequest.call(this, 'GET', '/club/api/v1/modules', {
				subdomain: this.getNodeParameter('subdomain', i),
				is_extra: isExtra || undefined,
			}),
		);
	},
};

const getPages: HotmartOperation = {
	description: [
		{
			displayName: 'Module ID',
			name: 'moduleId',
			type: 'string',
			default: '',
			required: true,
			description: 'ID of the module (from Get Modules)',
			displayOptions: show('getPages'),
		},
		productPicker('membersArea', 'getPages'),
	],
	async execute(i) {
		const moduleId = encodeURIComponent(String(this.getNodeParameter('moduleId', i)).trim());
		return itemsOf(
			await hotmartApiRequest.call(this, 'GET', `/club/api/v2/modules/${moduleId}/pages`, {
				product_id: getProductId.call(this, i),
			}),
		);
	},
};

const getStudents: HotmartOperation = {
	description: [
		subdomain('getStudents'),
		...returnAllAndLimit('membersArea', 'getStudents'),
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'name@email.com',
			default: '',
			description: 'Only return the student with this email',
			displayOptions: show('getStudents'),
		},
	],
	async execute(i) {
		return await hotmartApiRequestAllItems.call(
			this,
			'GET',
			'/club/api/v1/users',
			{ subdomain: this.getNodeParameter('subdomain', i), email: this.getNodeParameter('email', i, '') },
			getPaginationOptions.call(this, i),
		);
	},
};

const getStudentProgress: HotmartOperation = {
	description: [
		subdomain('getStudentProgress'),
		{
			displayName: 'Student ID',
			name: 'userId',
			type: 'string',
			default: '',
			required: true,
			description: 'The user_id of the student (from Get Students)',
			displayOptions: show('getStudentProgress'),
		},
	],
	async execute(i) {
		const userId = encodeURIComponent(String(this.getNodeParameter('userId', i)).trim());
		return itemsOf(
			await hotmartApiRequest.call(this, 'GET', `/club/api/v1/users/${userId}/lessons`, {
				subdomain: this.getNodeParameter('subdomain', i),
			}),
		);
	},
};

export const membersArea = buildResource(
	'membersArea',
	[
		{ name: 'Get Modules', value: 'getModules', action: 'Get the modules of a members area', description: 'List the modules of a course', operation: getModules },
		{ name: 'Get Pages', value: 'getPages', action: 'Get the pages of a module', description: 'List the pages (lessons) of a module, respecting class release rules', operation: getPages },
		{ name: 'Get Student Progress', value: 'getStudentProgress', action: 'Get the progress of a student', description: 'Lesson by lesson progress of one student', operation: getStudentProgress },
		{ name: 'Get Students', value: 'getStudents', action: 'Get the students of a members area', description: 'List the students of a course', operation: getStudents },
	],
	'getStudents',
);
