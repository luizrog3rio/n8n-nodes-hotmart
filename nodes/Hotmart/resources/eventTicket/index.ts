import type { INodeProperties } from 'n8n-workflow';

import { listOperation, number, text } from '../../shared/listOperation';
import { hotmartApiRequest } from '../../shared/transport';
import { buildResource, type HotmartOperation } from '../../shared/types';

const eventId = (operation: string): INodeProperties => ({
	displayName: 'Event ID',
	name: 'eventId',
	type: 'number',
	default: 0,
	required: true,
	displayOptions: { show: { resource: ['eventTicket'], operation: [operation] } },
});

const getInfo: HotmartOperation = {
	description: [eventId('getInfo')],
	async execute(i) {
		const id = this.getNodeParameter('eventId', i) as number;
		return await hotmartApiRequest.call(this, 'GET', `/events/api/v1/${id}/info`);
	},
};

/** Participants list: the path depends on the event, so wrap the generic list operation. */
const participantsList = (id: number) =>
	listOperation({
		resource: 'eventTicket',
		operation: 'getParticipants',
		path: `/events/api/v1/${id}/participants`,
		filters: [
			{ field: text('Buyer Email', 'buyerEmail'), query: 'buyer_email' },
			{ field: text('Participant Email', 'participantEmail'), query: 'participant_email' },
			{ field: number('Lot ID', 'lotId'), query: 'id_lot' },
			{ field: text('Ticket Status', 'ticketStatus'), query: 'ticket_status' },
			{ field: text('Ticket Type', 'ticketType'), query: 'ticket_type' },
			{ field: text('Check-In Status', 'checkinStatus'), query: 'checkin_status' },
		],
	});

const getParticipants: HotmartOperation = {
	description: [eventId('getParticipants'), ...participantsList(0).description],
	async execute(i) {
		const id = this.getNodeParameter('eventId', i) as number;
		return await participantsList(id).execute.call(this, i);
	},
};

export const eventTicket = buildResource(
	'eventTicket',
	[
		{ name: 'Get Info', value: 'getInfo', action: 'Get event info', description: 'Dates and ticket lots of an event', operation: getInfo },
		{ name: 'Get Participants', value: 'getParticipants', action: 'Get event participants', description: 'Tickets and participants of an event', operation: getParticipants },
	],
	'getParticipants',
);
