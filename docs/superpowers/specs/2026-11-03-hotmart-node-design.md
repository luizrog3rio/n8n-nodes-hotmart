# Design: `@luizrog3rio/n8n-nodes-hotmart`

Data: 2026-11-03 · Autor: Luiz Rogério (com Claude)

## 1. Intenção e porquê

Um community node do n8n para a API da Hotmart, substituindo o `n8n-nodes-hotmart` do thaleslaray.

**Por que o nosso:**
- O do Thales está **órfão**: a última versão (0.9.9) é de julho de 2025, e o repositório no GitHub foi apagado ou fechado. Só sobrou a versão compilada no npm.
- Ele declara `n8n-core` e `n8n-workflow` ^1.92 como dependência de runtime. Com o n8n 2.x isso é risco de conflito.
- Faltam nele recursos que a Hotmart já tem (veja a seção 6). A falta que mais pesou foi **listar ofertas**, necessário pra pegar o ID numérico de uma oferta (bloqueou o fluxo de convites do AprumaPRO).

**Quem usa:** Luiz, a RB7 Digital e os clientes, no n8n self-hosted (`n8n.rafabrito.com.br`, versão 2.x). O pacote fica público no npm de qualquer forma (escopo grátis), mas a v1 **não** é tratada como produto público com suporte.

**Sucesso:** substituir o node do Thales no dia a dia sem regressão de cobertura, com o token renovando sozinho, e passar no verificador de community nodes do n8n. A porta pro selo de verificado fica aberta.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos (v1)**
- Paridade com a cobertura do Thales, mais as lacunas da seção 6.
- Credencial com obtenção e **renovação automática** do token.
- Trigger por webhook com validação do hottok.
- Seguir o padrão do verificado: **zero dependência de runtime**, passar no lint e no scanner oficiais, licença MIT, interface em inglês.

**Não-objetivos (v1)**
- Link de Pagamento, Produto Físico (só parceiro autorizado), Dados de conta via GraphQL.
- Documentação caprichada, suíte completa de testes automatizados, pedido do selo de verificado.
- Registrar o webhook na Hotmart automaticamente. A API não permite pro produtor comum; a URL é colada à mão no painel.
- Tradução da interface (i18n).
- Migrar o fluxo de convites do AprumaPRO pro node novo. Pode ser feito depois.

**Anti-objetivos** (seria fracasso mesmo funcionando)
- Ter qualquer dependência de runtime.
- Esconder o erro da Hotmart. A mensagem original da API tem que chegar no n8n.
- Mudança que quebra fluxos existentes dentro da mesma versão maior, depois da 1.0.

## 3. Restrições (fatos da API, verificados na doc oficial em 03/11/2026)

- **Token:** `POST https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials&client_id=…&client_secret=…`, header `Authorization: Basic <token Basic da tela de credenciais>`, body vazio. A resposta traz `access_token` e `expires_in` ≈ 172799 (48h). Nas chamadas: `Authorization: Bearer <access_token>`.
- **Ambientes:** produção em `https://developers.hotmart.com`, sandbox em `https://sandbox.hotmart.com` (mesmo path). O tipo da credencial (sandbox ou produção) é definido na criação, lá na Hotmart. A doc não confirma se a URL do token muda no sandbox; vamos supor a mesma `api-sec-vlc`.
- **Paginação:** por cursor (`max_results`, `page_token`). A resposta traz `page_info.next_page_token`, que some na última página.
- **Datas:** sempre epoch em **milissegundos**.
- **Rate limit:** 500 req/min, com 429 quando estoura. Headers `RateLimit-*`. Consulta que passa de 30s dá 502.
- **Vendas:** os GETs, sem `transaction_status`, só retornam APPROVED e COMPLETE.
- **Cupom:** a API não cria cupom em produto de assinatura (`is_subscription`). O desconto vai como fração entre 0 e 0.99. Não existe edição de cupom, só criar, listar e excluir.
- **Ofertas e planos:** o path usa o **ucode** do produto, não o ID numérico.
- **Webhook:** payload v2.0.0. O hottok chega no header `X-HOTMART-HOTTOK`, é um por conta e só muda via suporte. A política de retry não é documentada.
- **n8n:** UI em inglês. `n8n-workflow` só como peerDependency/devDependency. Estrutura do `n8n-nodes-starter` / `@n8n/node-cli`.
- **Ambiente de dev:** Windows, com a pasta sincronizada com a VPS via Syncthing. Git com `core.autocrlf=input` e `core.filemode=false`. `node_modules` e `dist` não sincronizam (`.stignore`).

## 4. Abordagens consideradas

| # | Abordagem | Trade-off | Decisão |
|---|---|---|---|
| 1 | **Do zero sobre o `n8n-nodes-starter`**, TypeScript, credencial sob medida | Mais trabalho no começo; controle total; é o caminho que o n8n espera pra verificado | ✅ **Escolhida** pelo Luiz |
| 2 | Gerar a partir de OpenAPI | A Hotmart não publica OpenAPI: teria que escrever a spec à mão, e o node sai genérico | Descartada |
| 3 | Partir do pacote do Thales | Sem código-fonte (só o dist compilado) e herda a dependência quebrada | Descartada |
| 4 | Sem node, só templates de HTTP Request | Não resolve o pedido | Descartada |

## 5. Decisões

**Identidade**
- Pacote: `@luizrog3rio/n8n-nodes-hotmart` (o nome está livre no npm; a conta `luizrog3rio` já foi criada).
- Pasta: `Documents/projetos/ls-n8n-nodes-hotmart` (padrão `ls-` = pessoal).
- Licença MIT. Versão inicial `0.1.0`; a `1.0.0` só depois de uso real.
- Interface em **inglês**; o README ganha uma seção em português. *(Decisão do Claude, pra manter a porta do verificado aberta.)*

**Credencial "Hotmart API"**
- Campos: Client ID, Client Secret, Basic Token (como a Hotmart entrega) e Environment (Production/Sandbox).
- Usa `preAuthenticate` do n8n: busca o token, guarda num campo expirável e renova quando a API devolve 401. Autentica com `Authorization: Bearer`.
- Teste da credencial: `GET /user/api/v1/me`. *(Decisão do Claude.)*

**Credencial "Hotmart Webhook"** (separada, usada só pelo trigger)
- Campo: Hottok.

**Node "Hotmart": recursos e operações (33)**

| Recurso | Operações |
|---|---|
| Sale | Get History · Get Summary · Get Participants · Get Commissions · Get Price Details · Refund · Generate New Billet ⭐ |
| Subscription | Get Many · Get Summary · Get Transactions · Get Purchases · Cancel · Cancel Many · Reactivate · Reactivate Many · Change Due Day · Get Switch Plan Options ⭐ · Switch Plan ⭐ |
| Coupon | Create · Get Many · Delete |
| Product | Get Many · Get Offers ⭐ · Get Plans ⭐ · Update Email Settings ⭐ |
| Members Area | Get Modules · Get Pages (API v2) · Get Students · Get Student Progress |
| Event Ticket | Get Info · Get Participants |
| Installment Negotiation | Generate |
| Account | Get Me ⭐ |

⭐ = o node do Thales não tem.

**Comportamentos**
- **Produto:** um dropdown carregado da conta, com opção "By ID". Em Get Offers e Get Plans o usuário escolhe o produto normalmente e o **node resolve o ucode sozinho** (o usuário nunca vê ucode).
- **Paginação:** "Return All" (segue o `page_token` até o fim) ou "Limit".
- **Datas:** campos dateTime do n8n, convertidos pra epoch ms.
- **Desconto do cupom:** o campo mostra **porcentagem** (1–99) e o node converte pra fração. *(Decisão do Claude, pra evitar o erro clássico de mandar `10` achando que é 10%.)*
- **Vendas:** um campo "Transaction Status" com aviso no hint de que o padrão só traz aprovadas e completas.
- **Erros:** `NodeApiError` com a mensagem e o código originais da Hotmart. No 429, o erro diz quanto falta pro reset (header `RateLimit-Reset`).
- **Uso por agente de IA:** `usableAsTool: true`. *(Decisão do Claude.)*

**Node "Hotmart Trigger"**
- Webhook POST que responde 200 na hora.
- Parâmetro **Events**: multi-seleção com todos os 16 eventos da v2 (PURCHASE_APPROVED, PURCHASE_COMPLETE, PURCHASE_CANCELED, PURCHASE_BILLET_PRINTED, PURCHASE_PROTEST, PURCHASE_REFUNDED, PURCHASE_CHARGEBACK, PURCHASE_EXPIRED, PURCHASE_DELAYED, PURCHASE_OUT_OF_SHOPPING_CART, SUBSCRIPTION_CANCELLATION, SWITCH_PLAN, UPDATE_SUBSCRIPTION_CHARGE_DATE, CLUB_FIRST_ACCESS, CLUB_MODULE_COMPLETED, ORDER_FULFILLMENT ⭐). Vazio significa todos. Evento fora da seleção: responde 200 e não dispara o fluxo.
- **Hottok:** a credencial é opcional. Se estiver configurada, header ausente ou diferente leva a 401 e não dispara.
- Saída **única** com o payload inteiro. *(Decisão do Claude: o "modo smart" do Thales, com várias saídas, fica fora da v1.)*
- A tela mostra a URL e um aviso de que ela precisa ser colada no painel da Hotmart (Ferramentas → Webhook).

**Qualidade**
- Passar em `npm run lint` (regras do n8n) e no scanner de community nodes.
- Testes automatizados **só** dos helpers puros: paginação, conversão de datas, conversão de desconto e resolução de ucode.
- Teste manual de cada operação de leitura na conta real (produção).
- **Operações de escrita testadas no sandbox da Hotmart.** O Luiz tem credencial de sandbox com compra de teste. Isso vale pra Refund, Cancel/Cancel Many, Reactivate/Reactivate Many, Change Due Day, Switch Plan, Generate New Billet, Installment Negotiation e Update Email Settings. **Nenhuma escrita roda contra a conta de produção** durante o desenvolvimento. A única exceção é o cupom: criar e apagar um cupom de teste com código óbvio (`TESTE-NODE-…`) num produto que não seja o AprumaPRO.
- Se faltar no sandbox algum recurso pra testar uma escrita (por exemplo, assinatura de teste), a operação sai na 0.1.0 marcada como "não testada" no README, sem bloquear a release.
- Credenciais (produção e sandbox) são cadastradas no n8n pelo Luiz; o Claude não digita chave.

**Repositório e publicação** *(decisão do Claude, que o Luiz pode trocar: ele não escolheu entre conta pessoal e a org `rb7digital`)*
- Repositório **público** no GitHub: `luizrog3rio/n8n-nodes-hotmart`, combinando com o escopo do pacote. É ele que vai no campo `repository` do `package.json`.
- Publicação no npm **via GitHub Actions com provenance** (trusted publishing) desde a primeira versão, porque é o que o n8n exige pra verificação. Publicar dispara ao criar uma tag `v*`. Nada de `npm publish` manual da máquina.
- CI no push e no PR: lint + build + testes dos helpers.

## 6. O que entra além do Thales

Listar ofertas, listar planos, ver opções de troca de plano, trocar plano, gerar novo boleto, ver a conta logada, ligar/desligar os e-mails da Hotmart ao comprador e o evento `ORDER_FULFILLMENT` no trigger.

**Endpoints das operações novas** (base `https://developers.hotmart.com`, doc em `https://developers.hotmart.com/docs/pt-BR/<slug>`):

| Operação | Endpoint | Slug da doc | Status na doc |
|---|---|---|---|
| Get Offers | `GET /products/api/v1/products/:ucode/offers` (`max_results`, `page_token`) | `v1/product/product-offers/` | No menu (09/2025) |
| Get Plans | `GET /products/api/v1/products/:ucode/plans` (`max_results`, `page_token`) | `v1/product/product-plans/` | No menu (09/2025) |
| Generate New Billet | `PUT /payments/api/v1/sales/:transaction/billet` → `billet_url` | `v1/sales/sales-billet/` | No menu (07/2026) |
| Get Me | `GET /user/api/v1/me` | `v1/user/get-user-me/` | No menu (07/2026) |
| Get Switch Plan Options | `GET /payments/api/v1/subscriptions/switch-plan/plans` (`subscriber_codes[]`, `product_id`, `offer_codes[]`) | `v1/subscription/switch-plan-get-plans/` | **Fora do menu** |
| Switch Plan | `POST /payments/api/v1/subscriptions/switch-plan` (body `subscriber_code`, `offer_code`) | `v1/subscription/switch-plan/` | **Fora do menu** |
| Update Email Settings | `PUT /products/api/v1/product/configuration/:product_id` (body `is_allowed_to_email_the_buyer`) | `v1/product/product-configuration/` | **Fora do menu** |

**Primeira tarefa da implementação: um spike** que chama Get Me, Get Offers e as três operações "fora do menu" (só as de leitura, ou a de escrita sem efeito real) com a credencial do Luiz. A doc publica essas páginas, mas não as linka no menu, então não dá pra garantir que valem pra qualquer conta. Se alguma devolver 403/404, **sai da v1** e fica registrada como pendente. Se o `/me` falhar, o teste da credencial passa a ser `GET /products/api/v1/products?max_results=1`. *(Decisão do Claude.)*

**Formato de saída:** segue o padrão dos nodes oficiais, um item do n8n por registro da API. Não há fluxos usando o node do Thales no n8n do Luiz (nenhuma credencial dele cadastrada), então não precisa imitar o formato dele. *(Decisão do Claude.)*

## 7. Fica a cargo de quem construir

- Layout de arquivos e a escolha entre estilo declarativo e programático por operação.
- Nomes exatos dos campos, desde que em inglês e coerentes com os nodes oficiais.
- Framework de teste dos helpers.
- Como instalar a versão de desenvolvimento no n8n do Luiz pra testar (link local ou pré-release no npm com tag `beta`).
