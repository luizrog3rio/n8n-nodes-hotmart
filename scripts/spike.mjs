// Spike: confere quais endpoints respondem pra conta do Luiz, em produção e sandbox.
// Só leitura. Nunca imprime token nem segredo.
// Uso: node scripts/spike.mjs   (lê o .env da raiz do projeto)

process.loadEnvFile(new URL('../.env', import.meta.url));

const TOKEN_URL = 'https://api-sec-vlc.hotmart.com/security/oauth/token';
const ENVS = {
	production: { base: 'https://developers.hotmart.com', prefix: 'HOTMART_PROD' },
	sandbox: { base: 'https://sandbox.hotmart.com', prefix: 'HOTMART_SANDBOX' },
};

async function getToken({ prefix }) {
	const clientId = process.env[`${prefix}_CLIENT_ID`];
	const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
	const basic = process.env[`${prefix}_BASIC`];
	if (!clientId || !clientSecret || !basic) return { skipped: 'credencial vazia no .env' };
	const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;
	const res = await fetch(url, { method: 'POST', headers: { Authorization: basic, 'Content-Type': 'application/json' } });
	const body = await res.json().catch(() => ({}));
	return { status: res.status, token: body.access_token, expiresIn: body.expires_in };
}

async function call(base, token, path) {
	const res = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
	const text = await res.text();
	let json;
	try { json = JSON.parse(text); } catch { json = undefined; }
	const keys = json && typeof json === 'object' ? Object.keys(json).join(',') : text.slice(0, 80).replace(/\s+/g, ' ');
	return { status: res.status, keys, json };
}

const rows = [];
for (const [name, env] of Object.entries(ENVS)) {
	const tok = await getToken(env);
	if (tok.skipped) { rows.push([name, 'token', '-', tok.skipped]); continue; }
	rows.push([name, `POST ${TOKEN_URL}`, tok.status, tok.token ? `ok, expires_in=${tok.expiresIn}` : 'sem access_token']);
	if (!tok.token) continue;

	const me = await call(env.base, tok.token, '/user/api/v1/me');
	rows.push([name, 'GET /user/api/v1/me', me.status, me.keys]);

	const products = await call(env.base, tok.token, '/products/api/v1/products?max_results=1');
	rows.push([name, 'GET /products/api/v1/products?max_results=1', products.status, products.keys]);
	const first = products.json?.items?.[0];
	if (!first) { rows.push([name, '(sem produto pra testar ofertas/planos/switch-plan)', '-', '']); continue; }

	for (const path of [
		`/products/api/v1/products/${first.ucode}/offers`,
		`/products/api/v1/products/${first.ucode}/plans`,
		`/payments/api/v1/subscriptions/switch-plan/plans?product_id=${first.id}`,
	]) {
		const r = await call(env.base, tok.token, path);
		rows.push([name, `GET ${path.replace(first.ucode, ':ucode').replace(String(first.id), ':id')}`, r.status, r.keys]);
	}
}

console.log('ambiente | endpoint | status | observação');
for (const r of rows) console.log(r.join(' | '));
