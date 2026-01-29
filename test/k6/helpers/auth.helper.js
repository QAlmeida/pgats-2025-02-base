import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000'; // Variável de ambiente

export function login(email, password) {
  const payload = JSON.stringify({ email, password });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/users/login`, payload, params);

 
  if (res.status !== 200) {
    console.log('LOGIN ERRO -> status:', res.status, 'body:', res.body);
  }

  check(res, {
    'login status 200': (r) => r.status === 200,
    'login tem token': (r) => r.json('token') !== undefined,
  }, { type: 'login' });

  const token = res.json('token');
  return token;
}

export function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // uso de token de autenticação
    },
  };
}
