# Spike: live Hotmart API check (2026-11-03)

Read-only calls with `scripts/spike.mjs`, against production (the AprumaPRO account) and sandbox.

| Environment | Call | Status | Note |
|---|---|---|---|
| both | POST api-sec-vlc.hotmart.com/security/oauth/token | 200 | Same token URL for sandbox. `expires_in` = 172799 s (48h). |
| production | GET /user/api/v1/me | 200 | |
| sandbox | GET /user/api/v1/me | 404 | Not available on sandbox. |
| both | GET /products/api/v1/products?max_results=1 | 200 | `items`, `page_info`. Items: id, ucode, name, status, format, is_subscription, warranty_period, created_at. |
| production | GET /products/api/v1/products/:ucode/offers | 200 | Items: code, name, description, price {value, currency_code}, payment_mode, is_main_offer, ... **No numeric offer id.** |
| sandbox | GET .../:ucode/offers | 404 | |
| production | GET .../:ucode/plans | 400 | Tested on a non-subscription product: expected. Not yet confirmed on a subscription product. |
| production | GET /payments/api/v1/subscriptions/switch-plan/plans | 403 | "You don't have permission". Tested on a non-subscription product. |
| sandbox | GET .../switch-plan/plans | 200 | |
| sandbox | GET /products/api/v1/coupon/product/:id | 404 | Coupons do not exist on sandbox. |
| production | GET /products/api/v1/coupon/product/8584651 | 200 | No coupons yet; `page_info` only. |
| sandbox | GET /payments/api/v1/sales/history, /payments/api/v1/subscriptions | 200 | |

## Decisions

- **Credential test** now calls `GET /products/api/v1/products?max_results=1`, because `/me` is 404 on sandbox.
- **Coupon offer IDs:** the coupon API wants numeric `offer_ids` (longs), but Get Offers only returns offer codes. The field hint now says to copy the ID from the Hotmart dashboard.
- **Coupons cannot be tested on sandbox.** Coupon create/delete is tested in production with a `TESTE-NODE-…` coupon on a product other than AprumaPRO, as the spec allows.
- **Plans and switch plan** stay in the node; they need a subscription product to confirm.

## AprumaPRO (product 8584651) offers

| Code | Name | Price (BRL) | Main |
|---|---|---|---|
| 7cmbvz1m | (no name) | 10,000 | yes |
| 7gbr9vwq | Oferta Oficial | 100,000 | no |
| p0gywxze | (no name) | 9,000 | no |
| o4bea0m9 | Parcelado Hotmart via Link Exclusivo | 10,000 | no |

The numeric ID of offer 7gbr9vwq is not exposed by the API.

## Live coupon test (2026-11-03, approved by the user)

Coupon `TESTE-NODE-01` on AprumaPRO, 1%, ending the same day, restricted to offer `15804731`.

- **Without `start_date` the API answers 400** "It was not possible to save a coupon". The node now sends `start_date` = now when the user leaves it empty.
- **With `start_date`: 200.** The response has `id` (coupon id), `couponCode`, `startDate`, `endDate`, `discount`, `status` and `offers[]`, where each offer has `id` and `key` (the offer code). Offer `15804731` came back as `key: 7gbr9vwq`, "Oferta Oficial": **that is the numeric ID of 7gbr9vwq.**
- The list endpoint returns items with `id`, `coupon_code`, `discount`, `start_date`, `status`, `time_zone`.
- **DELETE /products/api/v1/coupon/:id: 200** with no body; the list was empty afterwards.
