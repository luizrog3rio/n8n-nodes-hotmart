# Changelog

## 0.1.0 (2026-11-03)

- First stable release. Same code as 0.1.0-beta.2; see the beta entries below for what is confirmed live and what is not.

## 0.1.0-beta.2 (2026-11-03)

- Credential help and README: if you restrict Allowed HTTP Request Domains, allow both `developers.hotmart.com` and `api-sec-vlc.hotmart.com`, separated by a comma.
- First release published with npm Trusted Publishing (no npm token in the repository).

## 0.1.0-beta.1 (2026-11-03)

- Nodes renamed to **Hotmart API** and **Hotmart API Trigger**. n8n keys installed community nodes by display name, so the old names clashed with the older `n8n-nodes-hotmart` package and the install failed with "duplicate key value violates unique constraint". Both packages can now be installed side by side.

## 0.1.0-beta.0 (2026-11-03)

- First release: Hotmart node with 33 operations (Account, Coupon, Event Ticket, Installment Negotiation, Members Area, Product, Sale, Subscription) and Hotmart Trigger with hottok validation and event filter.

### Not yet run against a live Hotmart account

Live test results so far. Operations listed as not confirmed follow the official docs but have not been run against a live account.

- Confirmed live inside n8n (queue mode, 2 workers): Coupon → Create, Get Many and Delete (12/12 runs); Hotmart API Trigger with the right hottok (also with surrounding spaces), wrong or missing hottok (401) and the event filter (ignored); Sale → Get History and Subscription → Get Switch Plan Options on sandbox.
- Sale → Refund: route confirmed in production (a fake transaction returns "Purchase not found"); not run on a real sale. Hotmart sandbox does not expose write routes (404).
- Not yet confirmed: Subscription → Cancel, Cancel Many, Reactivate, Reactivate Many, Change Due Day, Switch Plan; Sale → Generate New Billet; Installment Negotiation; Members Area; Event Ticket; Product → Update Email Settings. The sandbox answers 404 for these routes and the production account has no subscription to test on.
- Confirmed live inside n8n (0.1.0-beta.1): credential test with token, Account → Get Me, Product → Get Many and Get Offers, Coupon → Get Many.
- Confirmed live against the API: credential (token + test), Coupon → Create, Get Many and Delete (production), Account → Get Me (production only; 404 on sandbox), Product → Get Many, Product → Get Offers (production only), Sale → Get History and Subscription → Get Many (sandbox).
