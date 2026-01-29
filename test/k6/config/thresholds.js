export const thresholds = {
  http_req_duration: ['p(95)<500'],              // 95% das requisições abaixo de 500ms
  'checks{type:login}': ['rate>0.95'],           // 95% dos checks de login precisam passar
  'checks{type:checkout}': ['rate>0.95'],        // 95% dos checks de checkout precisam passar
  login_time: ['p(95)<400'],                     // trend personalizada de login
  checkout_time: ['p(95)<600'],                  // trend personalizada de checkout
};
