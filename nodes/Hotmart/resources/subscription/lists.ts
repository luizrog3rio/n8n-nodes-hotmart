import { date, listOperation, number, text, type ListFilter } from '../../shared/listOperation';

const STATUS = [
	'ACTIVE',
	'INACTIVE',
	'DELAYED',
	'CANCELLED_BY_CUSTOMER',
	'CANCELLED_BY_SELLER',
	'CANCELLED_BY_ADMIN',
	'STARTED',
	'OVERDUE',
];

const f = {
	productId: { field: number('Product ID', 'productId'), query: 'product_id' },
	planId: { field: number('Plan ID', 'planId'), query: 'plan_id' },
	status: {
		field: {
			displayName: 'Status',
			name: 'status',
			type: 'multiOptions',
			options: STATUS.map((s) => ({ name: s, value: s })),
			default: [],
		},
		query: 'status',
		kind: 'list',
	},
	subscriberCode: { field: text('Subscriber Code', 'subscriberCode'), query: 'subscriber_code' },
	subscriberEmail: { field: text('Subscriber Email', 'subscriberEmail'), query: 'subscriber_email' },
	subscriberName: { field: text('Subscriber Name', 'subscriberName'), query: 'subscriber_name' },
	transaction: { field: text('Transaction', 'transaction'), query: 'transaction' },
	offerCode: { field: text('Offer Code', 'offerCode'), query: 'offer_code' },
	trial: {
		field: {
			displayName: 'Trial',
			name: 'trial',
			type: 'boolean',
			default: false,
			description: 'Whether to return only subscriptions in trial',
		},
		query: 'trial',
	},
	accessionDate: { field: date('Accession Date From', 'accessionDate'), query: 'accession_date', kind: 'date' },
	endAccessionDate: {
		field: date('Accession Date To', 'endAccessionDate'),
		query: 'end_accession_date',
		kind: 'date',
	},
	cancelationDate: {
		field: date('Cancellation Date From', 'cancelationDate'),
		query: 'cancelation_date',
		kind: 'date',
	},
	endCancelationDate: {
		field: date('Cancellation Date To', 'endCancelationDate'),
		query: 'end_cancelation_date',
		kind: 'date',
	},
	dateNextCharge: { field: date('Next Charge From', 'dateNextCharge'), query: 'date_next_charge', kind: 'date' },
	endDateNextCharge: {
		field: date('Next Charge To', 'endDateNextCharge'),
		query: 'end_date_next_charge',
		kind: 'date',
	},
	transactionDate: {
		field: date('Transaction Date From', 'transactionDate'),
		query: 'transaction_date',
		kind: 'date',
	},
	endTransactionDate: {
		field: date('Transaction Date To', 'endTransactionDate'),
		query: 'end_transaction_date',
		kind: 'date',
	},
} satisfies Record<string, ListFilter>;

export const getMany = listOperation({
	resource: 'subscription',
	operation: 'getMany',
	path: '/payments/api/v1/subscriptions',
	filters: [
		f.productId,
		f.planId,
		f.status,
		f.subscriberCode,
		f.subscriberEmail,
		f.transaction,
		f.trial,
		f.accessionDate,
		f.endAccessionDate,
		f.cancelationDate,
		f.endCancelationDate,
		f.dateNextCharge,
		f.endDateNextCharge,
	],
});

export const getSummary = listOperation({
	resource: 'subscription',
	operation: 'getSummary',
	path: '/payments/api/v1/subscriptions/summary',
	hint: 'Data can be up to 24h delayed',
	filters: [f.productId, f.subscriberCode, f.accessionDate, f.endAccessionDate, f.dateNextCharge],
});

export const getTransactions = listOperation({
	resource: 'subscription',
	operation: 'getTransactions',
	path: '/payments/api/v1/subscriptions/transactions',
	filters: [
		f.productId,
		f.transaction,
		f.subscriberName,
		f.subscriberEmail,
		f.subscriberCode,
		f.offerCode,
		f.transactionDate,
		f.endTransactionDate,
	],
});
