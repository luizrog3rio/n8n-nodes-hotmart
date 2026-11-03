# Hotmart n8n Node Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar `@luizrog3rio/n8n-nodes-hotmart`: um node "Hotmart" com 33 operações e um "Hotmart Trigger", no padrão de community node verificado.

**Architecture:** Projeto em cima do `n8n-nodes-starter` atual (CLI `@n8n/node-cli`, `n8n-node build/lint/release`). O node é programático: `Hotmart.node.ts` roteia `resource/operation` para arquivos de operação que exportam `description` + `execute`. Todo HTTP passa por `shared/transport.ts`, que usa a credencial `hotmartApi` (token obtido e renovado via `preAuthentication`). A lógica pura (datas, desconto, paginação, hottok, filtro de eventos) fica em helpers testados com vitest.

**Tech Stack:** TypeScript 5.9, `@n8n/node-cli` ≥ 0.55, `n8n-workflow` (peerDependency), vitest (dev), GitHub Actions (CI + publish com provenance).

**Spec:** `docs/superpowers/specs/2026-11-03-hotmart-node-design.md` — leia antes de qualquer tarefa.

## Global Constraints

- Nome do pacote: `@luizrog3rio/n8n-nodes-hotmart`. Licença MIT. Versão inicial `0.1.0`.
- **Zero dependências de runtime.** `n8n-workflow` só em `peerDependencies` (`*`) e `devDependencies`. Nada em `dependencies`.
- Interface (displayName, description, hints, opções) **em inglês**. README com uma seção em português.
- `package.json` → `"keywords": ["n8n-community-node-package"]`, `"n8n": { "n8nNodesApiVersion": 1, "strict": true, ... }`, `"repository.url": "https://github.com/luizrog3rio/n8n-nodes-hotmart.git"`.
- Base URL: produção `https://developers.hotmart.com`, sandbox `https://sandbox.hotmart.com`. Token: `POST https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials&client_id=…&client_secret=…` com `Authorization: <Basic token como a Hotmart entrega, já com o prefixo "Basic ">`, body vazio. (A Task 1 confirma a URL do token no sandbox.)
- Datas enviadas à API: epoch **milissegundos**.
- Desconto de cupom: a UI recebe porcentagem inteira de 1 a 99; a API recebe fração (`90` → `0.9`).
- Paginação: `max_results` + `page_token`; o fim é quando `page_info.next_page_token` some.
- Erros: sempre `NodeApiError` carregando a mensagem original da Hotmart. No 429, a mensagem inclui os segundos de `RateLimit-Reset`.
- **Nenhuma operação de escrita roda contra produção** durante o desenvolvimento, exceto criar e apagar um cupom `TESTE-NODE-<timestamp>` num produto que não seja o AprumaPRO (ID 8584651).
- Segredos (client id, secret, basic, hottok) ficam só em `.env` (gitignored), preenchido pelo Luiz. O agente nunca escreve valores de segredo em arquivo, commit ou log.
- Git: `core.filemode=false` (o `core.autocrlf=input` global já vale). Line endings LF.
- `node_modules/` e `dist/` não vão pro git (o Syncthing já os ignora).

## Review Focus

1. **"Return All" num histórico grande, ou uma API que repete o mesmo `page_token`:** tem que parar, nunca entrar em loop infinito. → teste em Task 3 (`paginate stops on repeated token`).
2. **Token expira no meio de uma execução longa (401):** o n8n renova via `preAuthentication`/expirable e repete a chamada. → teste manual de Task 2 (passo de forçar token inválido).
3. **Desconto digitado errado (`0.9`, `0`, `100`, `150`):** erro claro antes de chamar a API, nunca mandar desconto errado. → teste em Task 3 (`percentToFraction rejects…`).
4. **Data escolhida no fuso de São Paulo:** "2026-11-01" (só data) tem que virar o início do dia em America/Sao_Paulo, não UTC; data já com fuso é respeitada. → teste em Task 3 (`toEpochMs date-only uses timezone`).
5. **Webhook sem hottok, com hottok errado, ou com evento não selecionado/ausente:** 401 sem disparar no hottok inválido; 200 sem disparar no evento fora do filtro; nunca derrubar a execução. → testes em Task 9.

---

## File Structure

```
ls-n8n-nodes-hotmart/
├─ package.json, tsconfig.json, eslint.config.mjs, .prettierrc.js   (do starter)
├─ vitest.config.ts
├─ .gitignore  (+ .env, dist, node_modules)
├─ .env.example                         HOTMART_* vazios
├─ LICENSE.md, README.md, CHANGELOG.md
├─ .github/workflows/ci.yml, publish.yml
├─ scripts/spike.mjs                    Task 1 (não vai pro pacote)
├─ docs/spike-results.md                Task 1
├─ credentials/
│  ├─ HotmartApi.credentials.ts         OAuth client_credentials + preAuthentication
│  └─ HotmartWebhookApi.credentials.ts  hottok
├─ nodes/Hotmart/
│  ├─ Hotmart.node.ts / .node.json / hotmart.svg / hotmart.dark.svg
│  ├─ shared/utils.ts          toEpochMs, percentToFraction, cleanQuery, getBaseUrl
│  ├─ shared/pagination.ts     paginate
│  ├─ shared/transport.ts      hotmartApiRequest, hotmartApiRequestAllItems, toHotmartError
│  ├─ shared/descriptions.ts   campos reutilizados (product picker, returnAll/limit, date range)
│  ├─ shared/product.ts        resolveProductUcode
│  ├─ listSearch/getProducts.ts
│  └─ resources/<resource>/index.ts + <operation>.ts
├─ nodes/HotmartTrigger/
│  ├─ HotmartTrigger.node.ts / .node.json / svgs
│  └─ events.ts                HOTMART_EVENTS, checkHottok, shouldTrigger
└─ test/  utils.test.ts, pagination.test.ts, transport.test.ts, product.test.ts, trigger.test.ts
```

**Contrato de operação** (vale para toda pasta `resources/`):

```ts
// resources/<resource>/<operation>.ts
export const description: INodeProperties[];   // campos com displayOptions.show { resource, operation }
export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject | IDataObject[]>;

// resources/<resource>/index.ts
export const <resource>Description: INodeProperties[];  // dropdown de operation + todos os description
export const <resource>Operations: Record<string, { execute: typeof execute }>;
```

Valores de `resource`: `sale`, `subscription`, `coupon`, `product`, `membersArea`, `eventTicket`, `installmentNegotiation`, `account`.

---

### Task 1: Spike dos endpoints (antes de qualquer código do node)

**Files:**
- Create: `scripts/spike.mjs`, `docs/spike-results.md`, `.env.example`, `.gitignore`

**Interfaces:**
- Produces: `docs/spike-results.md` com uma tabela `endpoint | ambiente | status HTTP | observação` e a lista final de operações que **saem** da v1.

- [ ] **Step 1:** `git init`, `git config core.filemode false`, criar `.gitignore` com `node_modules/`, `dist/`, `.env`, e `.env.example` com as chaves vazias: `HOTMART_PROD_CLIENT_ID`, `HOTMART_PROD_CLIENT_SECRET`, `HOTMART_PROD_BASIC`, `HOTMART_SANDBOX_CLIENT_ID`, `HOTMART_SANDBOX_CLIENT_SECRET`, `HOTMART_SANDBOX_BASIC`.
- [ ] **Step 2:** Pedir ao Luiz que copie `.env.example` → `.env` e preencha. **Não continuar sem isso.** (A credencial de produção é a da conta dona do AprumaPRO, criada em Ferramentas → Credenciais Hotmart.)
- [ ] **Step 3:** Escrever `scripts/spike.mjs` (Node 20+, `fetch` nativo, lê `.env` com `process.loadEnvFile`). Para cada ambiente: pega o token em `api-sec-vlc` (registra se o sandbox aceitou essa URL) e chama **só leitura**: `GET /user/api/v1/me`, `GET /products/api/v1/products?max_results=1`, `GET /products/api/v1/products/:ucode/offers` (ucode do 1º produto), `GET /products/api/v1/products/:ucode/plans`, `GET /payments/api/v1/subscriptions/switch-plan/plans?product_id=<id>`. Imprime método, path, status e as chaves do JSON (nunca o token nem os segredos).
- [ ] **Step 4:** Rodar `node scripts/spike.mjs`. Esperado: tabela impressa, sem segredo no output.
- [ ] **Step 5:** Registrar em `docs/spike-results.md`. Regras: 403/404 em produção **e** sandbox → a operação sai da v1 (anotar). `/me` falhou → teste da credencial vira `GET /products/api/v1/products?max_results=1`. URL do token no sandbox diferente → registrar a correta. Update Email Settings e Switch Plan (escrita) **não** são chamados; se a leitura do switch-plan der 403/404, Switch Plan também sai. Mostrar o resultado ao Luiz.
- [ ] **Step 6:** Commit `chore: spike dos endpoints da Hotmart`.

### Task 2: Scaffold + credencial `hotmartApi`

**Files:**
- Create: tudo do `n8n-nodes-starter` (sem os exemplos GithubIssues/Example), `credentials/HotmartApi.credentials.ts`, `vitest.config.ts`, `LICENSE.md` (MIT, Luiz Rogério Neves Santos), `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Produces: credencial `name: 'hotmartApi'` com os campos `clientId`, `clientSecret`, `basicToken`, `environment` (`'production' | 'sandbox'`, default `production`) e `accessToken` (hidden, `typeOptions: { expirable: true, password: true }`).

- [ ] **Step 1:** Copiar o starter (`gh repo clone n8n-io/n8n-nodes-starter` para uma pasta temporária, copiar os arquivos sem `.git`), apagar os exemplos, ajustar `package.json` (nome, descrição, author `Luiz Rogério <luizrog3rio@rb7digital.com.br>`, repository, homepage, `n8n.credentials`/`n8n.nodes` apontando pros arquivos deste plano), adicionar `"test": "vitest run"` e o devDependency `vitest`. Rodar `npm install`.
- [ ] **Step 2:** Implementar `HotmartApi.credentials.ts`:
  - `preAuthentication(credentials)` → POST na URL do token (Global Constraints, ou a corrigida pela Task 1) com `Authorization: credentials.basicToken` → `{ accessToken: response.access_token }`.
  - `authenticate`: header `Authorization: =Bearer {{$credentials.accessToken}}`.
  - `test.request`: baseURL por ambiente + o endpoint de teste definido na Task 1.
  - Hints em inglês dizendo onde pegar as chaves e que o "Basic" é colado inteiro.
- [ ] **Step 3:** `ci.yml` igual ao do starter, mais um step `npm test`.
- [ ] **Step 4:** Rodar `npm run lint && npm run build`. Esperado: sem erro.
- [ ] **Step 5 (manual):** `npm run dev` (sobe um n8n local com o pacote linkado). O Luiz cria a credencial com os dados de **sandbox** e clica em "Test". Esperado: "Connection tested successfully". Com um Client Secret errado → erro legível da Hotmart, não um stack trace. Renovação (Review Focus 2): numa execução manual de um node da Task 4, trocar o `accessToken` salvo por lixo via `n8n` → a chamada recebe 401, o n8n roda o `preAuthentication` de novo e a execução termina com sucesso.
- [ ] **Step 6:** Commit `feat: scaffold e credencial Hotmart API`.

### Task 3: Helpers puros

**Files:**
- Create: `nodes/Hotmart/shared/utils.ts`, `nodes/Hotmart/shared/pagination.ts`
- Test: `test/utils.test.ts`, `test/pagination.test.ts`

**Interfaces:**
- Produces:
  - `getBaseUrl(environment: 'production' | 'sandbox'): string`
  - `toEpochMs(value: string | number | undefined, timezone: string): number | undefined`
  - `percentToFraction(percent: number): number` — lança `Error('Discount must be a whole percentage between 1 and 99')`
  - `cleanQuery(qs: IDataObject): IDataObject` — remove `undefined`, `null`, `''` e arrays vazios
  - `paginate(fetchPage: (pageToken?: string) => Promise<{ items: IDataObject[]; nextPageToken?: string }>, opts: { returnAll: boolean; limit: number }): Promise<IDataObject[]>`

- [ ] **Step 1: testes que falham**

```ts
// test/utils.test.ts
expect(getBaseUrl('production')).toBe('https://developers.hotmart.com');
expect(getBaseUrl('sandbox')).toBe('https://sandbox.hotmart.com');
it('toEpochMs date-only uses timezone', () =>
  expect(toEpochMs('2026-11-01', 'America/Sao_Paulo')).toBe(Date.UTC(2026, 10, 1, 3)));
it('toEpochMs keeps explicit offset', () =>
  expect(toEpochMs('2026-11-01T10:00:00Z', 'America/Sao_Paulo')).toBe(Date.UTC(2026, 10, 1, 10)));
expect(toEpochMs(1730419200000, 'UTC')).toBe(1730419200000);
expect(toEpochMs(undefined, 'UTC')).toBeUndefined();
expect(toEpochMs('', 'UTC')).toBeUndefined();
expect(percentToFraction(90)).toBe(0.9);
expect(percentToFraction(1)).toBe(0.01);
it('percentToFraction rejects out of range and fractions', () => {
  for (const bad of [0, 100, 150, 0.9, -5, NaN]) expect(() => percentToFraction(bad)).toThrow('between 1 and 99');
});
expect(cleanQuery({ a: 1, b: '', c: undefined, d: [], e: null, f: ['x'], g: false }))
  .toEqual({ a: 1, f: ['x'], g: false });
```

```ts
// test/pagination.test.ts — fetchPage falso que devolve páginas pré-montadas
it('paginate returnAll follows tokens until missing');      // 3 páginas de 2 → 6 itens, 3 chamadas
it('paginate respects limit and stops early');              // limit 3 → 3 itens, 2 chamadas
it('paginate stops on repeated token');                     // página devolve sempre o mesmo token → para na 2ª chamada, sem loop
it('paginate returns [] when first page is empty');
```

- [ ] **Step 2:** `npx vitest run test/utils.test.ts test/pagination.test.ts` → FAIL (módulos inexistentes).
- [ ] **Step 3:** Implementar. `toEpochMs` usa o `DateTime` do Luxon que vem com o `n8n-workflow` (peer, sem dependência nova): string só de data (`/^\d{4}-\d{2}-\d{2}$/`) é interpretada no `timezone`; ISO com offset é respeitada; número passa direto.
- [ ] **Step 4:** Rodar de novo → PASS.
- [ ] **Step 5:** Commit `feat: helpers de data, desconto, query e paginação`.

### Task 4: Transport + node "Hotmart" com Account e Product

**Files:**
- Create: `shared/transport.ts`, `shared/product.ts`, `shared/descriptions.ts`, `listSearch/getProducts.ts`, `Hotmart.node.ts`, `Hotmart.node.json`, ícones, `resources/account/*`, `resources/product/*`
- Test: `test/transport.test.ts`, `test/product.test.ts`

**Interfaces:**
- Consumes: Task 3 helpers; credencial `hotmartApi`.
- Produces:
  - `hotmartApiRequest(this: IExecuteFunctions | ILoadOptionsFunctions, method: IHttpRequestMethods, path: string, qs?: IDataObject, body?: IDataObject): Promise<IDataObject>` — base URL vem de `getBaseUrl(credentials.environment)`; usa `httpRequestWithAuthentication.call(this, 'hotmartApi', …)`; passa `cleanQuery(qs)`; erro → `toHotmartError`.
  - `hotmartApiRequestAllItems(this, method, path, qs, opts: { returnAll: boolean; limit: number }): Promise<IDataObject[]>` — `paginate` com `max_results = returnAll ? 100 : min(limit, 100)`, lê `items` e `page_info.next_page_token`.
  - `toHotmartError(node: INode, error: unknown): NodeApiError` — 429: `message = 'Hotmart rate limit reached (500 requests/minute). Try again in <RateLimit-Reset>s.'`; demais: mantém `error.response.body.message`/`error_description` da Hotmart.
  - `resolveProductUcode(this: IExecuteFunctions, productId: number): Promise<string>` — `GET /products/api/v1/products?id=<id>` → `items[0].ucode`; sem item → `NodeOperationError('Product <id> not found in this Hotmart account')`.
  - `productPicker`: resourceLocator `productId` com modos `list` (searchListMethod `getProducts`, mostra `name (id)`) e `id`.
  - `returnAllAndLimit(resource, operation)`: campos `returnAll` (boolean, default false) e `limit` (number, default 50, 1–500).
  - O router do `Hotmart.node.ts`: loop por item, chama `<resource>Operations[operation].execute`, `constructExecutionMetaData` + `returnJsonArray`, respeita `continueOnFail()` devolvendo `{ error: message }`. `usableAsTool: true`. `subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}'`.

| Resource / Operation | Request | Campos |
|---|---|---|
| account / getMe | `GET /user/api/v1/me` | — |
| product / getMany | `GET /products/api/v1/products` | returnAll/limit; filtros `status` (options da spec), `format` (options da spec) |
| product / getOffers | `GET /products/api/v1/products/{ucode}/offers` | productPicker (ucode via `resolveProductUcode`), returnAll/limit |
| product / getPlans | `GET /products/api/v1/products/{ucode}/plans` | idem |
| product / updateEmailSettings | `PUT /products/api/v1/product/configuration/{productId}` body `{ is_allowed_to_email_the_buyer }` | productPicker, boolean `allowHotmartEmails` |

(Operação que a Task 1 tirou da v1: não implementar.)

- [ ] **Step 1: testes que falham** (mock de `this.helpers.httpRequestWithAuthentication` e `this.getCredentials`)

```ts
it('toHotmartError puts reset seconds in 429 message');         // headers { 'ratelimit-reset': '42' } → message contém 'Try again in 42s'
it('toHotmartError keeps Hotmart message');                     // body { message: 'Invalid coupon code' } → message contém 'Invalid coupon code'
it('hotmartApiRequest uses sandbox base url');                  // environment 'sandbox' → url começa com https://sandbox.hotmart.com
it('hotmartApiRequestAllItems reads items and next_page_token');
it('resolveProductUcode returns ucode');                        // items [{ id: 8584651, ucode: '88829f20-…' }]
it('resolveProductUcode throws clear error when not found');    // items [] → 'Product 123 not found in this Hotmart account'
```

- [ ] **Step 2:** `npx vitest run test/transport.test.ts test/product.test.ts` → FAIL.
- [ ] **Step 3:** Implementar transport, product, descriptions, listSearch, node e os recursos da tabela.
- [ ] **Step 4:** Testes → PASS; `npm run lint && npm run build` → sem erro.
- [ ] **Step 5 (manual, `npm run dev`):** com a credencial de **produção**: Get Me; Product Get Many; Get Offers do AprumaPRO (8584651) mostra a oferta `7gbr9vwq` com o `id` numérico — **anotar esse id pro Luiz** (ele destrava o fluxo de convites). Update Email Settings só no **sandbox**.
- [ ] **Step 6:** Commit `feat: node Hotmart com Account e Product`.

### Task 5: Coupon

**Files:**
- Create: `resources/coupon/index.ts`, `create.ts`, `getMany.ts`, `delete.ts`

**Interfaces:**
- Consumes: `hotmartApiRequest`, `hotmartApiRequestAllItems`, `percentToFraction`, `toEpochMs`, `productPicker`.

| Operation | Request | Campos |
|---|---|---|
| create | `POST /products/api/v1/product/{productId}/coupon` body `{ code, discount, start_date?, end_date?, affiliate?, offer_ids? }` | productPicker, `code` (string, máx. 25, required), `discountPercent` (number 1–99, required; hint "90 = 90% off"), opcionais `startDate`, `endDate` (dateTime), `affiliateId` (number), `offerIds` (string "123,456" → number[]) |
| getMany | `GET /products/api/v1/coupon/product/{productId}` | productPicker, filtro `code`, returnAll/limit |
| delete | `DELETE /products/api/v1/coupon/{couponId}` | `couponId` (number, required) → saída `{ deleted: true, couponId }` |

- [ ] **Step 1:** Implementar. No create, `code.length > 25` → `NodeOperationError` antes de chamar a API. O timezone vem de `this.getTimezone()`.
- [ ] **Step 2:** `npm run lint && npm run build && npm test` → sem erro.
- [ ] **Step 3 (manual, produção, produto que NÃO seja o 8584651):** create `TESTE-NODE-<timestamp>` com 10 → getMany com `code` acha o cupom com `discount: 0.1` → delete pelo id → getMany não acha mais. Testar também desconto `0.9` → erro "between 1 and 99" sem chamada à API.
- [ ] **Step 4:** Commit `feat: recurso Coupon`.

### Task 6: Sale

**Files:**
- Create: `resources/sale/index.ts` + um arquivo por operação

**Interfaces:**
- Consumes: transport, `toEpochMs`, `returnAllAndLimit`, `productPicker` (opcional aqui, modo `id` aceita vazio).

Filtros comuns às leituras (collection "Filters"): `productId`, `startDate`, `endDate` (→ `start_date`/`end_date` em ms), `transaction`, `transactionStatus` (multiOptions: APPROVED, BLOCKED, CANCELLED, CHARGEBACK, COMPLETE, EXPIRED, NO_FUNDS, OVERDUE, PARTIALLY_REFUNDED, PRE_ORDER, PRINTED_BILLET, PROCESSING_TRANSACTION, PROTESTED, REFUNDED, STARTED, UNDER_ANALISYS, WAITING_PAYMENT), com o hint **"Leave empty to get only APPROVED and COMPLETE sales (Hotmart default)."**

| Operation | Request | Filtros extras |
|---|---|---|
| getHistory | `GET /payments/api/v1/sales/history` | buyerName, buyerEmail, paymentType, offerCode, salesSource, commissionAs |
| getSummary | `GET /payments/api/v1/sales/summary` | affiliateName, paymentType, offerCode, salesSource |
| getParticipants | `GET /payments/api/v1/sales/users` | buyerEmail, buyerName, salesSource, affiliateName, commissionAs |
| getCommissions | `GET /payments/api/v1/sales/commissions` | commissionAs |
| getPriceDetails | `GET /payments/api/v1/sales/price/details` | paymentType |
| refund | `PUT /payments/api/v1/sales/{transaction}/refund` | `transaction` required → `{ refundRequested: true, transaction }` |
| generateNewBillet | `PUT /payments/api/v1/sales/{transaction}/billet` | `transaction` required → resposta (`billet_url`) |

- [ ] **Step 1:** Implementar (todas as leituras com returnAll/limit).
- [ ] **Step 2:** `npm run lint && npm run build && npm test` → sem erro.
- [ ] **Step 3 (manual):** leituras em produção com intervalo de 30 dias, conferindo que os totais batem com o painel. Refund e Generate New Billet **só no sandbox**, na compra de teste do Luiz.
- [ ] **Step 4:** Commit `feat: recurso Sale`.

### Task 7: Subscription

**Files:**
- Create: `resources/subscription/index.ts` + um arquivo por operação

| Operation | Request | Campos |
|---|---|---|
| getMany | `GET /payments/api/v1/subscriptions` | returnAll/limit; filtros productId, planId, status (multi: ACTIVE, INACTIVE, DELAYED, CANCELLED_BY_CUSTOMER, CANCELLED_BY_SELLER, CANCELLED_BY_ADMIN, STARTED, OVERDUE), subscriberCode, subscriberEmail, transaction, trial, accessionDate/endAccessionDate, cancelationDate/endCancelationDate, dateNextCharge/endDateNextCharge |
| getSummary | `GET /payments/api/v1/subscriptions/summary` | returnAll/limit; productId, subscriberCode, accessionDate/endAccessionDate, dateNextCharge; hint "Data can be up to 24h delayed." |
| getTransactions | `GET /payments/api/v1/subscriptions/transactions` | returnAll/limit; productId, transaction, subscriberName, subscriberEmail, subscriberCode, offerCode, transactionDate/endTransactionDate |
| getPurchases | `GET /payments/api/v1/subscriptions/{subscriberCode}/purchases` | subscriberCode required |
| cancel | `POST /payments/api/v1/subscriptions/{subscriberCode}/cancel` body `{ send_mail }` | subscriberCode, `sendEmail` (default true) |
| cancelMany | `POST /payments/api/v1/subscriptions/cancel` body `{ subscriber_code: string[], send_mail }` | `subscriberCodes` (string separada por vírgula → array) |
| reactivate | `POST /payments/api/v1/subscriptions/{subscriberCode}/reactivate` body `{ charge }` | subscriberCode, `chargeNow` (default false) |
| reactivateMany | `POST /payments/api/v1/subscriptions/reactivate` body `{ subscriber_code: string[], charge }` | subscriberCodes, chargeNow |
| changeDueDay | `PATCH /payments/api/v1/subscriptions/{subscriberCode}` body `{ due_day }` | subscriberCode, `dueDay` (1–31) |
| getSwitchPlanOptions | `GET /payments/api/v1/subscriptions/switch-plan/plans` | subscriberCodes, productId, offerCodes |
| switchPlan | `POST /payments/api/v1/subscriptions/switch-plan` body `{ subscriber_code, offer_code }` | subscriberCode, offerCode |

- [ ] **Step 1:** Implementar (pular o que a Task 1 tirou).
- [ ] **Step 2:** `npm run lint && npm run build && npm test` → sem erro.
- [ ] **Step 3 (manual):** leituras em produção. Todas as escritas **só no sandbox**. Se o sandbox não tiver assinatura de teste, marcar essas operações como "not tested" no README (spec, seção Qualidade) e seguir.
- [ ] **Step 4:** Commit `feat: recurso Subscription`.

### Task 8: Members Area, Event Ticket e Installment Negotiation

**Files:**
- Create: `resources/membersArea/*`, `resources/eventTicket/*`, `resources/installmentNegotiation/*`

| Resource / Operation | Request | Campos |
|---|---|---|
| membersArea / getModules | `GET /club/api/v1/modules` | `subdomain` required, `isExtra` opcional |
| membersArea / getPages | `GET /club/api/v2/modules/{moduleId}/pages?product_id=` | moduleId, productPicker |
| membersArea / getStudents | `GET /club/api/v1/users` | subdomain, filtro email, returnAll/limit |
| membersArea / getStudentProgress | `GET /club/api/v1/users/{userId}/lessons` | subdomain, userId |
| eventTicket / getInfo | `GET /events/api/v1/{eventId}/info` | eventId |
| eventTicket / getParticipants | `GET /events/api/v1/{eventId}/participants` | eventId, returnAll/limit, filtros buyerEmail, participantEmail, lotId, ticketStatus, ticketType, checkinStatus |
| installmentNegotiation / generate | `POST /payments/api/v1/installments/negotiate` body `{ subscription_id, recurrences, payment_type, discount?, document? }` | subscriptionId, `recurrences` ("1,2" → number[], 1–5 itens, validar antes), `paymentType` (BILLET/PIX/CASH_PAYMENT), `discountValue` opcional → `{ type: 'CUSTOM', value }`, `document` (obrigatório quando BILLET: validar antes de chamar) |

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `npm run lint && npm run build && npm test` → sem erro.
- [ ] **Step 3 (manual):** leituras em produção com um subdomínio real do Luiz. Generate **só no sandbox**.
- [ ] **Step 4:** Commit `feat: Members Area, Event Ticket e Installment Negotiation`.

### Task 9: Hotmart Trigger + credencial `hotmartWebhookApi`

**Files:**
- Create: `credentials/HotmartWebhookApi.credentials.ts`, `nodes/HotmartTrigger/HotmartTrigger.node.ts`, `.node.json`, ícones, `nodes/HotmartTrigger/events.ts`
- Test: `test/trigger.test.ts`

**Interfaces:**
- Produces:
  - `HOTMART_EVENTS: ReadonlyArray<{ name: string; value: string }>` — os 16 eventos da spec, em ordem, com nome em inglês ("Purchase Approved"…).
  - `checkHottok(expected: string | undefined, received: string | string[] | undefined): boolean` — `true` se `expected` vazio; senão, comparação exata (array → primeiro valor).
  - `shouldTrigger(selected: string[], event: unknown): boolean` — `selected` vazio → `true` só se `event` for string não vazia; senão `selected.includes(event)`.
  - Credencial `name: 'hotmartWebhookApi'`, campo `hottok` (password). No trigger ela é `required: false`.
  - Trigger: `webhooks: [{ name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook' }]`, parâmetro `events` (multiOptions de `HOTMART_EVENTS`, default `[]`) e um notice: "Copy the Production URL above and paste it in Hotmart → Tools → Webhook. Hotmart does not allow registering webhooks automatically." `webhook()`: hottok inválido → `res.status(401).send('Invalid hottok')` + `{ noWebhookResponse: true }`; evento fora do filtro → responde 200 sem `workflowData`; caso contrário → `workflowData: [[{ json: body }]]`.

- [ ] **Step 1: testes que falham**

```ts
expect(HOTMART_EVENTS).toHaveLength(16);
expect(HOTMART_EVENTS.map((e) => e.value)).toContain('ORDER_FULFILLMENT');
it('checkHottok accepts anything when not configured', () => expect(checkHottok(undefined, undefined)).toBe(true));
it('checkHottok rejects missing header', () => expect(checkHottok('abc', undefined)).toBe(false));
it('checkHottok rejects wrong value', () => expect(checkHottok('abc', 'abd')).toBe(false));
it('checkHottok accepts header array', () => expect(checkHottok('abc', ['abc'])).toBe(true));
it('shouldTrigger with empty selection needs an event', () => {
  expect(shouldTrigger([], 'PURCHASE_APPROVED')).toBe(true);
  expect(shouldTrigger([], undefined)).toBe(false);
});
it('shouldTrigger filters', () => expect(shouldTrigger(['PURCHASE_APPROVED'], 'PURCHASE_REFUNDED')).toBe(false));
```

- [ ] **Step 2:** `npx vitest run test/trigger.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `events.ts`, a credencial e o trigger.
- [ ] **Step 4:** Testes → PASS; `npm run lint && npm run build` → sem erro.
- [ ] **Step 5 (manual, `npm run dev`):** com a URL de teste: `curl` com payload de exemplo e o hottok certo → dispara; hottok errado → 401 e não dispara; evento fora do filtro → 200 e não dispara. Depois, um webhook real do **sandbox** da Hotmart apontando pra URL (via túnel do `n8n-node dev`, ou depois da Task 10, no n8n do Luiz).
- [ ] **Step 6:** Commit `feat: Hotmart Trigger`.

### Task 10: README, publicação e release 0.1.0

**Files:**
- Create: `README.md` (inglês + seção "Em português"), `CHANGELOG.md`, `.github/workflows/publish.yml`
- Modify: `package.json` (versão)

**Interfaces:**
- Consumes: tudo acima; `docs/spike-results.md` (operações que saíram ficam listadas no README como "not available").

- [ ] **Step 1:** README: instalação (Settings → Community Nodes → `@luizrog3rio/n8n-nodes-hotmart`), como criar as credenciais (onde pegar as chaves; o Basic é colado inteiro), tabela de operações, operações "not tested" (se houver), como configurar o webhook na Hotmart. Seção em português com o mesmo conteúdo resumido.
- [ ] **Step 2:** `publish.yml` = o do starter com o filtro de tag trocado para `tags: ['v*.*.*']`, Trusted Publishing (OIDC) e `npm run release` com provenance.
- [ ] **Step 3:** `npm run lint && npm run build && npm test` → sem erro. Rodar o scanner de community nodes (`npx @n8n/scan-community-package` contra o tarball de `npm pack`) → sem erro.
- [ ] **Step 4:** Commit `docs: README e workflow de publicação`.
- [ ] **Step 5 (com o Luiz, que aprova cada ação externa):** criar o repositório público `luizrog3rio/n8n-nodes-hotmart` com `gh repo create`, fazer push e ver o CI verde.
- [ ] **Step 6 (Luiz):** no npmjs.com, configurar o Trusted Publisher (owner `luizrog3rio`, repo `n8n-nodes-hotmart`, workflow `publish.yml`). Se o npm exigir o pacote já existir pra configurar, usar a opção B do starter (token granular em `NPM_TOKEN`) só na primeira publicação.
- [ ] **Step 7:** Versão `0.1.0-beta.0`, tag `v0.1.0-beta.0`, push da tag (com OK do Luiz). Esperado: Action verde e pacote visível em `npm view @luizrog3rio/n8n-nodes-hotmart`.
- [ ] **Step 8 (Luiz + agente):** instalar a beta no `n8n.rafabrito.com.br` (Community Nodes), refazer o smoke test (Get Me, Get Offers do AprumaPRO, Trigger com webhook do sandbox).
- [ ] **Step 9:** Se o smoke passar, versão `0.1.0`, tag `v0.1.0`, push (com OK do Luiz). Atualizar o CHANGELOG.
