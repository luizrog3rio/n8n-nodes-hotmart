# @luizrog3rio/n8n-nodes-hotmart

n8n community node for the [Hotmart](https://hotmart.com) API: sales, subscriptions, coupons, products, members area, event tickets, installment negotiation, plus a webhook trigger.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Webhook](#webhook) · [Em português](#em-português)

## Installation

In n8n: **Settings → Community Nodes → Install** and enter `@luizrog3rio/n8n-nodes-hotmart`.

## Credentials

### Hotmart API

1. In Hotmart, open **Tools → Hotmart Credentials** and create a credential (production or sandbox).
2. Copy the **Client ID**, **Client Secret** and **Basic** token. Hotmart shows them only once.
3. In n8n, create a **Hotmart API** credential, choose the same **Environment** and paste the three values. Paste the Basic token whole, including the `Basic ` prefix.

The node gets the access token and renews it automatically when it expires (every ~48h).

### Hotmart Webhook (optional)

Holds your account **hottok** (Hotmart → Tools → Webhook). When set, the trigger rejects requests whose `X-HOTMART-HOTTOK` header does not match.

## Operations

| Resource | Operations |
|---|---|
| Account | Get Me |
| Coupon | Create, Delete, Get Many |
| Event Ticket | Get Info, Get Participants |
| Installment Negotiation | Generate |
| Members Area | Get Modules, Get Pages, Get Student Progress, Get Students |
| Product | Get Many, Get Offers, Get Plans, Update Email Settings |
| Sale | Generate New Billet, Get Commissions, Get History, Get Participants, Get Price Details, Get Summary, Refund |
| Subscription | Cancel, Cancel Many, Change Due Day, Get Many, Get Purchases, Get Summary, Get Switch Plan Options, Get Transactions, Reactivate, Reactivate Many, Switch Plan |

Things worth knowing:

- **Coupon discount** is a whole percentage: `90` means 90% off. Hotmart does not allow coupons on subscription products.
- **Sales** without a *Transaction Status* filter return only APPROVED and COMPLETE sales (Hotmart default).
- **Dates** without a timezone use the workflow timezone.
- **Return All** follows Hotmart's pagination until the last page.
- Hotmart allows 500 requests per minute; on a 429 the error says how long to wait.

## Webhook

1. Add a **Hotmart Trigger** node and pick the events (empty = all).
2. Copy its **Production URL**.
3. In Hotmart, **Tools → Webhook → Add**, paste the URL, pick the product and events, and choose version **2.0.0**.
4. Activate the workflow.

Hotmart does not offer an API to register webhooks, so this step is manual.

## Compatibility

Built with `@n8n/node-cli` for n8n 2.x. No runtime dependencies.

> **Status: beta.** Every operation is checked against the official Hotmart docs and covered by unit tests where it has logic, but not every one has been run against a live account yet. Operations not yet confirmed against the real API are listed in the [changelog](CHANGELOG.md).

## License

[MIT](LICENSE.md)

---

## Em português

Node da comunidade pro n8n que conversa com a API da Hotmart: vendas, assinaturas, cupons, produtos, Área de Membros, ingressos, negociação de parcelas e um gatilho de webhook.

**Instalar:** no n8n, *Settings → Community Nodes → Install* e digite `@luizrog3rio/n8n-nodes-hotmart`.

**Credencial "Hotmart API":** na Hotmart, *Ferramentas → Credenciais Hotmart*, crie a credencial (produção ou sandbox) e copie Client ID, Client Secret e o token Basic. Eles só aparecem uma vez. No n8n, escolha o mesmo ambiente e cole os três, com o Basic inteiro (incluindo `Basic `). O token renova sozinho.

**Webhook:** use o node *Hotmart Trigger*, copie a *Production URL* e cole em *Ferramentas → Webhook* na Hotmart, versão 2.0.0. Pra validar as chamadas, crie a credencial "Hotmart Webhook" com o seu hottok.

**Atenção:**
- O desconto do cupom é em porcentagem inteira (`90` = 90% off).
- Vendas sem filtro de status só trazem aprovadas e completas, que é o padrão da Hotmart.
