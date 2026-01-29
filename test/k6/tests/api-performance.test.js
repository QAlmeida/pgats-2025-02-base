// test/k6/tests/api-performance.test.js
import http from 'k6/http';
import { check, group } from 'k6';
import { users } from '../data/users.data.js';
import { login, authHeaders } from '../helpers/auth.helper.js';
import { randomCheckout } from '../helpers/data.helper.js';
import { loginTime, checkoutTime } from '../config/trends.js';
import { thresholds } from '../config/thresholds.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";



const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export const options = {
  thresholds,
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 0 },
  ],
};

// Setup: Registrar usuários ANTES do teste
export function setup() {
  console.log('=== SETUP: Registrando usuários ===');

  const baseUsers = [
    { name: 'Alice', email: 'alice@pgats.com', password: '123456' },
    { name: 'Bob', email: 'bob@pgats.com', password: '123456' },
    { name: 'Carol', email: 'carol@pgats.com', password: '123456' },
    { name: 'David', email: 'david@pgats.com', password: '123456' },
    { name: 'Iuri', email: 'iuri@pgats.com', password: '123456' },
  ];

  baseUsers.forEach((user) => {
    const payload = JSON.stringify(user);
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${BASE_URL}/api/users/register`, payload, params);

    // Ignora erro se usuário já existe (status 400)
    if (res.status === 200 || res.status === 201) {
      console.log(`✓ Usuário ${user.email} registrado com sucesso`);
    } else if (res.status === 400 && res.body.includes('já cadastrado')) {
      console.log(`⚠ Usuário ${user.email} já existe (ignorando)`);
    } else {
      console.log(`✗ Erro ao registrar ${user.email}: ${res.status} - ${res.body}`);
    }
  });

  console.log('=== SETUP concluído ===');
}

export default function () {
  // Data-Driven: escolher usuário com base no VU
  const user = users[(__VU - 1) % users.length];

  let token;

  group('Login do usuário', () => {
    const start = Date.now();
    token = login(user.email, user.password);
    const duration = Date.now() - start;
    loginTime.add(duration);

    check(token, {
      'token não é vazio': (t) => t && t.length > 0,
    }, { type: 'login' });
  });

  group('Checkout autenticado', () => {
    const checkoutData = randomCheckout();

    const payload = JSON.stringify({
      items: checkoutData.items,
      freight: checkoutData.freight,
      paymentMethod: checkoutData.paymentMethod,
      cardData: checkoutData.paymentMethod === 'credit_card'
        ? checkoutData.cardData
        : null,
    });

    const params = authHeaders(token);

    const start = Date.now();
    const res = http.post(`${BASE_URL}/api/checkout`, payload, params);
 
    if (res.status !== 200) {
      console.log('CHECKOUT ERRO -> status:', res.status, 'body:', res.body);
    }
    const duration = Date.now() - start;
    checkoutTime.add(duration);



    check(res, {
      'checkout status 200': (r) => r.status === 200,
      'checkout retorna valorFinal': (r) => r.json('valorFinal') !== undefined,
    }, { type: 'checkout' });
  });
}

export function handleSummary(data) {
  return {
    "test/k6/report.html": htmlReport(data),
    "stdout": textSummary(data, { indent: " ", enableColors: true }),
  };
}
