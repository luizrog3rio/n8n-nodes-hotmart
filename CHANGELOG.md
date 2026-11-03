# Changelog

## 0.1.0-beta.1 (2026-11-03)

- Nodes renamed to **Hotmart API** and **Hotmart API Trigger**. n8n keys installed community nodes by display name, so the old names clashed with the older `n8n-nodes-hotmart` package and the install failed with "duplicate key value violates unique constraint". Both packages can now be installed side by side.

## 0.1.0-beta.0 (2026-11-03)

- First release: Hotmart node with 33 operations (Account, Coupon, Event Ticket, Installment Negotiation, Members Area, Product, Sale, Subscription) and Hotmart Trigger with hottok validation and event filter.

### Not yet run against a live Hotmart account

Pending the first live test. This list shrinks as operations are confirmed; any that fail are removed before 0.1.0.

- Confirmed live inside n8n (0.1.0-beta.1): credential test with token, Account → Get Me, Product → Get Many and Get Offers, Coupon → Get Many.
- Confirmed live against the API: credential (token + test), Coupon → Create, Get Many and Delete (production), Account → Get Me (production only; 404 on sandbox), Product → Get Many, Product → Get Offers (production only), Sale → Get History and Subscription → Get Many (sandbox).
- Not yet confirmed: every other operation, Get Plans and Get Switch Plan Options on a subscription product, all writes, and the trigger.
