# Changelog

## 0.1.0 (unreleased)

- First release: Hotmart node with 33 operations (Account, Coupon, Event Ticket, Installment Negotiation, Members Area, Product, Sale, Subscription) and Hotmart Trigger with hottok validation and event filter.

### Not yet run against a live Hotmart account

Pending the first live test. This list shrinks as operations are confirmed; any that fail are removed before 0.1.0.

- Confirmed live: credential (token + test), Coupon → Create, Get Many and Delete (production), Account → Get Me (production only; 404 on sandbox), Product → Get Many, Product → Get Offers (production only), Sale → Get History and Subscription → Get Many (sandbox).
- Not yet confirmed: every other operation, Get Plans and Get Switch Plan Options on a subscription product, all writes, and the trigger.
