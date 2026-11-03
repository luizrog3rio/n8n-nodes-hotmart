import { choice, date, number, text, type ListFilter } from '../../shared/listOperation';

export const TRANSACTION_STATUS = [
	'APPROVED', 'BLOCKED', 'CANCELLED', 'CHARGEBACK', 'COMPLETE', 'EXPIRED', 'NO_FUNDS', 'OVERDUE',
	'PARTIALLY_REFUNDED', 'PRE_ORDER', 'PRINTED_BILLET', 'PROCESSING_TRANSACTION', 'PROTESTED',
	'REFUNDED', 'STARTED', 'UNDER_ANALISYS', 'WAITING_PAYMENT',
];
export const PAYMENT_TYPE = [
	'BILLET', 'CASH_PAYMENT', 'CREDIT_CARD', 'DIRECT_BANK_TRANSFER', 'DIRECT_DEBIT', 'FINANCED_BILLET',
	'FINANCED_INSTALLMENT', 'GOOGLE_PAY', 'HOTCARD', 'HYBRID', 'MANUAL_TRANSFER', 'PAYPAL',
	'PAYPAL_INTERNACIONAL', 'PICPAY', 'PIX', 'SAMSUNG_PAY', 'WALLET',
];

export const STATUS_HINT = 'Without "Transaction Status", Hotmart returns only APPROVED and COMPLETE sales';

export const f = {
	productId: { field: number('Product ID', 'productId'), query: 'product_id' },
	startDate: { field: date('Start Date', 'startDate'), query: 'start_date', kind: 'date' },
	endDate: { field: date('End Date', 'endDate'), query: 'end_date', kind: 'date' },
	transaction: { field: text('Transaction', 'transaction', 'Transaction code, e.g. HP02316330308193'), query: 'transaction' },
	transactionStatus: {
		field: choice('Transaction Status', 'transactionStatus', TRANSACTION_STATUS, STATUS_HINT),
		query: 'transaction_status',
	},
	buyerName: { field: text('Buyer Name', 'buyerName'), query: 'buyer_name' },
	buyerEmail: { field: text('Buyer Email', 'buyerEmail'), query: 'buyer_email' },
	paymentType: { field: choice('Payment Type', 'paymentType', PAYMENT_TYPE), query: 'payment_type' },
	offerCode: { field: text('Offer Code', 'offerCode', 'Offer code, e.g. 7gbr9vwq'), query: 'offer_code' },
	salesSource: { field: text('Sales Source (SRC)', 'salesSource'), query: 'sales_source' },
	commissionAs: {
		field: choice('Commission As', 'commissionAs', ['PRODUCER', 'COPRODUCER', 'AFFILIATE']),
		query: 'commission_as',
	},
	affiliateName: { field: text('Affiliate Name', 'affiliateName'), query: 'affiliate_name' },
} satisfies Record<string, ListFilter>;

export const base = [f.productId, f.startDate, f.endDate, f.transaction, f.transactionStatus];
