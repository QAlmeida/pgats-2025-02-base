# Testes de Performance com k6 – API REST (Login + Checkout)

Este projeto implementa testes de performance com **k6** sobre a API REST utilizada anteriormente no curso, focando nos fluxos de **login** e **checkout**.  
Além do código, o objetivo é demonstrar, de forma explícita, a aplicação de todos os conceitos exigidos: thresholds, checks, helpers, trends, dados dinâmicos, variáveis de ambiente, stages, reaproveitamento de resposta, uso de token, data-driven e groups.

---

## 1. API testada e objetivo dos testes

### 1.1. API alvo

- Base URL: `http://localhost:3000`


- `POST /api/users/register` – Registra usuário (retorna 201 com objeto `user`)
- `POST /api/users/login` – Realiza login (retorna 200 com `token`)
- `POST /api/checkout` – Realiza checkout autenticado (retorna 200 com `valorFinal`)

### 1.2. Objetivo dos testes de performance

O teste de performance foi desenhado para:

- Simular múltiplos usuários fazendo **login** e **checkout** em paralelo.
- Medir tempos de resposta (tempo de login, tempo de checkout, `http_req_duration`).
- Validar critérios de desempenho (thresholds), por exemplo:
  - 95% das requisições abaixo de 500 ms.
  - Pelo menos 95% dos checkouts bem sucedidos.
  - Pelo menos 95% dos logins bem sucedidos.

---

## 2. Papel do k6 no projeto

O **k6** é utilizado como ferramenta de:

- Teste de carga/stress: simula usuários virtuais (VUs) fazendo requisições HTTP.
- Coleta de métricas: latência, taxa de erro, throughput etc.
- Validação de thresholds: critérios de aceitação de performance.
- Geração de relatórios: saída em HTML para análise visual.

---

## 3. Arquitetura dos testes

A estrutura de pastas de performance foi organizada em:

- `test/k6/tests/api-performance.test.js` – Script principal do k6  
- `test/k6/helpers/auth.helper.js` – Login, token, headers  
- `test/k6/helpers/data.helper.js` – Geração de dados dinâmicos  
- `test/k6/data/users.data.js` – SharedArray com lista de usuários  
- `test/k6/config/thresholds.js` – Thresholds centralizados  
- `test/k6/config/trends.js` – Métricas customizadas (Trend)  

### 3.1. Explicação da estrutura

- **tests/**  
  Contém o arquivo principal `api-performance.test.js`, que o k6 executa.

- **helpers/**  
  - `auth.helper.js`: abstrai a lógica de login e headers de autenticação.
  - `data.helper.js`: gera dados dinâmicos para o checkout (itens, frete, método de pagamento, nome do titular).

- **data/**  
  - `users.data.js`: lista de usuários de teste carregada em um `SharedArray` para Data-Driven Testing.

- **config/**  
  - `thresholds.js`: define os thresholds de performance.
  - `trends.js`: define métricas customizadas (Trends) para tempo de login e checkout.

---

---

## 4. Conceitos exigidos (um por seção)

A seguir, explico onde cada conceito foi aplicado, com caminho do arquivo e explicação.  
Os trechos de código são descritos em texto para evitar quebra de formatação na cópia.

---

### 4.1. Thresholds

Arquivo: `test/k6/config/thresholds.js`

Conteúdo (em resumo):

- É exportado um objeto chamado `thresholds` com as seguintes entradas:

  - `http_req_duration: ['p(95)<500']`  
    95% das requisições HTTP devem ter duração menor que 500 ms.

  - `'checks{type:login}': ['rate>0.95']`  
    Pelo menos 95% dos checks marcados com a tag `type:login` precisam passar.

  - `'checks{type:checkout}': ['rate>0.95']`  
    Pelo menos 95% dos checks marcados com a tag `type:checkout` precisam passar.

  - `login_time: ['p(95)<400']`  
    95% dos valores da Trend `login_time` devem ser menores que 400 ms.

  - `checkout_time: ['p(95)<600']`  
    95% dos valores da Trend `checkout_time` devem ser menores que 600 ms.

Uso no script principal: `test/k6/tests/api-performance.test.js`

- No topo do arquivo, é feito:

  - `import { thresholds } from '../config/thresholds.js';`

- No export de `options`:

  - `export const options = { thresholds, stages: [...] };`

Explicação:

- Os thresholds definem critérios de aceitação para o teste de performance.  
- Se qualquer um deles for violado, o k6 marca o teste como falhado ao final da execução.

---

### 4.2. Checks

Arquivo: `test/k6/helpers/auth.helper.js`

- A função `login(email, password)`:

  - Monta um JSON com `{ email, password }`.
  - Envia um POST para `BASE_URL + '/api/users/login'` com cabeçalho `Content-Type: application/json`.
  - Recebe a resposta `res`.
  - Aplica `check` na resposta:

    - `"login status 200"` → verifica se `res.status === 200`.
    - `"login tem token"` → verifica se `res.json('token')` é diferente de `undefined`.

  - Esses checks são marcados com a tag `{ type: 'login' }`.
  - Depois, a função retorna o valor de `res.json('token')`.

Arquivo: `test/k6/tests/api-performance.test.js`

- No group `"Login do usuário"`:

  - Chama `login(user.email, user.password)`, mede a duração e adiciona na Trend `loginTime`.
  - Aplica um check adicional sobre o `token`:

    - `"token não é vazio"` → verifica se o token existe e tem comprimento maior que 0.
    - Também com tag `{ type: 'login' }`.

- No group `"Checkout autenticado"`:

  - Envia um POST para `BASE_URL + '/api/checkout'` com o payload de checkout.
  - Aplica `check` na resposta:

    - `"checkout status 200"` → `res.status === 200`.
    - `"checkout retorna valorFinal"` → `res.json('valorFinal')` não é `undefined`.

  - Esses checks são marcados com a tag `{ type: 'checkout' }`.

Explicação:

- Os checks validam se as respostas da API estão corretas (status, token, campos obrigatórios).
- As taxas de sucesso desses checks são usadas pelos thresholds para decidir se o teste passou ou não.

---

### 4.3. Helpers

Arquivo: `test/k6/helpers/auth.helper.js`

- Define funções de apoio para autenticação:

  1. `login(email, password)`:
     - Faz o POST de login na rota `/api/users/login`.
     - Verifica o status e a presença de `token` com `check`.
     - Retorna o token extraído do JSON da resposta.

  2. `authHeaders(token)`:
     - Retorna um objeto com cabeçalhos:
       - `Content-Type: application/json`
       - `Authorization: Bearer <token>`
     - É usado nas requisições autenticadas (checkout).

Arquivo: `test/k6/helpers/data.helper.js`

- Define um array com alguns nomes (ex.: "João Silva", "Maria Santos", etc.).
- Define a função `randomCheckout()` que:

  - Decide aleatoriamente se o pagamento será por boleto ou cartão (`paymentMethod`).
  - Gera um array `items` com dois produtos:
    - `productId` 1, quantidade aleatória entre 1 e 3.
    - `productId` 2, quantidade aleatória entre 1 e 2.
  - Gera um valor de frete (`freight`) aleatório entre 10 e 40.
  - Se o método de pagamento for cartão (`credit_card`), preenche:
    - `number` com um número de cartão de teste fixo.
    - `name` com um nome aleatório da lista.
    - `expiry` e `cvv` com valores de exemplo.
  - Se o método for boleto, `cardData` é `null`.

Explicação:

- Helpers separam responsabilidades:
  - `auth.helper.js` cuida da parte de login e headers de autenticação.
  - `data.helper.js` cuida da geração de dados de entrada para checkout.
- Isso deixa o script principal mais legível e facilita manutenção.

---

### 4.4. Trends

Arquivo: `test/k6/config/trends.js`

- Importa `Trend` de `k6/metrics`.
- Cria duas Trends:

  - `loginTime = new Trend('login_time');`
  - `checkoutTime = new Trend('checkout_time');`

Uso em `test/k6/tests/api-performance.test.js`:

- No group `"Login do usuário"`:

  - Antes do login, guarda o timestamp inicial.
  - Depois do login, calcula `duration = Date.now() - start`.
  - Chama `loginTime.add(duration)` para registrar o tempo dessa operação.

- No group `"Checkout autenticado"`:

  - Faz o mesmo: mede o tempo de uma chamada de checkout e adiciona em `checkoutTime`.

Explicação:

- Trends armazenam valores numéricos (nesse caso, tempos de execução).
- No relatório do k6 é possível ver estatísticas de cada Trend (média, p95, p99 etc.).
- Thresholds foram definidos também sobre essas Trends (por exemplo, p95 do `login_time`).

---

### 4.5. Dados dinâmicos (substituindo Faker)

Contexto:

- O escopo do trabalho cita o uso de Faker para gerar dados realistas.
- A biblioteca `faker` no jslib do k6 foi descontinuada (a URL oficial não funciona mais).
- Para manter o espírito do requisito, foi implementada geração de dados dinâmicos manual, via JavaScript puro.

Arquivo: `test/k6/helpers/data.helper.js`

- Usa um array de nomes para variar os titulares de cartão.
- Usa funções `Math.random()` e `Math.floor()` para:

  - Sortear quantidades de itens.
  - Sortear o valor do frete.
  - Sortear o método de pagamento (boleto ou cartão).
  - Sortear um nome para o titular do cartão (quando o método é cartão).

Explicação:

- A ideia central do Faker é ter dados diferentes a cada execução, fugindo de valores estáticos.
- Mesmo sem depender da biblioteca externa, o projeto mantém essa característica usando lógica própria.
- Isso torna os testes mais próximos de um cenário real, onde cada usuário compra coisas diferentes, com valores diferentes.

---

### 4.6. Variáveis de ambiente

Arquivo: `test/k6/tests/api-performance.test.js`

No topo do arquivo existe uma constante chamada `BASE_URL`, definida usando a variável de ambiente `API_URL` com um valor padrão igual a `http://localhost:3000`.

Significado:

- `__ENV.API_URL` é uma variável de ambiente lida pelo k6 na execução.
- Se `API_URL` não for informada, o script assume `http://localhost:3000`.
- Assim, o mesmo teste pode ser executado apontando para outros ambientes apenas mudando a variável de ambiente, sem alterar o código.

Exemplos de execução:

- Usando a base padrão (localhost:3000): `npm run perf:test`
- Sobrescrevendo a base pela variável de ambiente: `API_URL=http://localhost:3000 npm run perf:test`

---

### 4.7. Stages

Arquivo: `test/k6/tests/api-performance.test.js`

Dentro do objeto `options`, há uma propriedade `stages` com três estágios configurados:

1. Primeiro estágio:
   - Duração: 30 segundos.
   - Alvo (target): 5 VUs.
   - Efeito: ramp-up, o k6 aumenta gradualmente o número de usuários virtuais até chegar em 5.

2. Segundo estágio:
   - Duração: 1 minuto.
   - Alvo: 5 VUs.
   - Efeito: período estável de carga, com 5 VUs.

3. Terceiro estágio:
   - Duração: 30 segundos.
   - Alvo: 0 VUs.
   - Efeito: ramp-down, o k6 reduz o número de VUs de 5 até 0.

Isso forma um teste de carga com rampa de subida, platô e rampa de descida, simulando um uso mais realista da API.

---

### 4.8. Reaproveitamento de resposta e uso de token

Arquivos principais:

- `test/k6/helpers/auth.helper.js`
- `test/k6/tests/api-performance.test.js`

Fluxo resumido:

1. No helper de autenticação:
   - A função `login(email, password)` faz a requisição POST em `/api/users/login`.
   - Ela valida a resposta (status 200 e presença do campo `token`).
   - Ela retorna o valor do `token` extraído do JSON da resposta.

2. No script principal:
   - Dentro do group **"Login do usuário"**, a função `login(...)` é chamada com os dados de um usuário de teste.
   - O token retornado é armazenado em uma variável (por exemplo, `token`).
   - É feito um check garantindo que o token não é vazio.
   - Dentro do group **"Checkout autenticado"**, essa variável `token` é reutilizada:
     - É chamada a função `authHeaders(token)` para montar os headers.
     - O header `Authorization: Bearer <token>` é enviado na requisição de checkout para `/api/checkout`.

Conclusão:

- A resposta do login (token JWT) é reaproveitada em chamadas subsequentes (checkout).
- Isso demonstra o conceito de reaproveitamento de resposta e uso de token de autenticação em testes de performance.

---

### 4.9. Data-Driven Testing

Arquivos:

- `test/k6/data/users.data.js`
-test/k6/tests/api-performance.test.js`

No arquivo `users.data.js`:

- É importado `SharedArray` de `k6/data`.
- É criada e exportada uma constante `users` usando `new SharedArray('users', () => { ... })`.
- O `SharedArray` retorna uma lista de usuários, cada um com `email` e `password`, por exemplo:
  - `alice@pgats.com / 123456`
  - `bob@pgats.com / 123456`
  - `carol@pgats.com / 123456`
  - `david@pgats.com / 123456`
  - `eve@pgats.com / 123456`

No arquivo `api-performance.test.js`:

- A lista de usuários é importada: `import { users } from '../data/users.data.js'`.
- Dentro da função `default`, antes do login, é selecionado um usuário com base no número do VU (`__VU`), de forma parecida com:
  - `const user = users[(__VU - 1) % users.length];`
- Esse usuário (email e senha) é utilizado na chamada de login.

Explicação:

- O `SharedArray` garante que a lista de usuários seja carregada uma única vez e compartilhada entre todos os VUs, economizando memória.
- O cálculo com `(__VU - 1) % users.length` distribui os usuários entre os VUs de forma circular (round-robin).
- Isso caracteriza um cenário de **Data-Driven Testing**, pois os dados de entrada vêm de um arquivo separado de dados (`users.data.js`) e não estão fixos dentro da função principal.

---

### 4.10. Groups

Arquivo: `test/k6/tests/api-performance.test.js`

Na função `default`, o fluxo do teste é organizado em dois grupos principais usando a função `group` do k6:

1. Grupo **"Login do usuário"**:
   - Responsável por:
     - Selecionar o usuário da lista de testes.
     - Executar a função de login.
     - Medir o tempo de login e alimentar a Trend `login_time`.
     - Executar checks relacionados ao login e ao token retornado.

2. Grupo **"Checkout autenticado"**:
   - Responsável por:
     - Gerar dados dinâmicos de checkout (itens, frete, método de pagamento).
     - Enviar a requisição para `/api/checkout` usando o token obtido no login.
     - Medir o tempo de checkout e alimentar a Trend `checkout_time`.
     - Executar checks relacionados ao status da resposta e ao campo `valorFinal`.

Benefícios:

- O uso de `group` organiza o código do teste em blocos lógicos.
- No relatório do k6 (incluindo o HTML), é possível visualizar métricas separadas por grupo, facilitando a análise de cada parte do fluxo (login versus checkout).

---

## 5. Setup: registro de usuários antes do teste

Arquivo: `test/k6/tests/api-performance.test.js`

Além da função `default`, o script define uma função `setup()` exportada. O k6 executa essa função automaticamente uma única vez, antes de iniciar o teste de carga.

Resumo do que o `setup()` faz:

- Registra console uma mensagem indicando o início do setup (por exemplo, "SETUP: Registrando usuários").
- Cria uma lista fixa de usuários, cada um com `name`, `email` e `password` (por exemplo: `alice@pgats.com`, `bob@pgats.com`, etc.).
- Para cada usuário dessa lista:
  - Monta um JSON com os dados do usuário.
  - Envia um POST para `/api/users/register`.
  - Analisa o `res.status`:
    - Se for 200 ou 201, considera que o usuário foi registrado com sucesso e registra isso no log.
    - Se for 400 com mensagem indicando que o e-mail já existe, entende que esse usuário já está cadastrado e registra um aviso, sem tratar como erro crítico.
    - Qualquer outro status é tratado como erro de registro e também é logado.

Objetivo:

- Garantir que os usuários que serão usados nos testes (definidos em `users.data.js`) existam na base da API antes de rodar o teste de performance.
- Evitar que falhas de login aconteçam simplesmente porque o usuário não foi cadastrado.

---

## 6. Como executar os testes

### 6.1. Pré-requisitos

1. API REST rodando localmente:

   - A API deve estar em execução em `http://localhost:3000`.
   - Normalmente, isso é feito com um comando como `npm start` no projeto da API.
   - No Swagger (`/api-docs`), devem existir as rotas:
     - `POST /api/users/register`
     - `POST /api/users/login`
     - `POST /api/checkout`

2. k6 instalado na máquina:

   - Verificar com `k6 version`.
   - Caso não esteja instalado, usar o gerenciador de pacotes adequado (chocolatey, winget, brew, apt, etc.).

### 6.2. Scripts no package.json

No `package.json` do projeto de testes, foram definidos scripts semelhantes a:

- `"perf:test": "k6 run test/k6/tests/api-performance.test.js"`
- `"perf:test:html": "k6 run --out html=test/k6/report.html test/k6/tests/api-performance.test.js"`

Isso permite executar o k6 via `npm run`.

### 6.3. Comandos de execução

- Executar o teste padrão (usando a base padrão do script):

  - `npm run perf:test`

- Executar o teste apontando explicitamente para uma base via variável de ambiente:

  - `API_URL=http://localhost:3000 npm run perf:test`

- Executar o teste gerando um relatório HTML:

  - `API_URL=http://localhost:3000 npm run perf:test:html`

Este último comando gera um arquivo `report.html` dentro da pasta `test/k6---

## 7. Relatório HTML

Quando o teste é executado com a opção de saída HTML, o k6 gera um relatório completo em formato de página web.

Local padrão do arquivo neste projeto:

- `test/k6/report.html`

Conteúdo do relatório:

- Gráfico de requisições ao longo do tempo.
- Distribuição de latências (mediana, p90, p95, p99).
- Taxas de sucesso e falhas de requisições e checks.
- Indicação visual de quais thresholds foram atendidos e quais foram quebrados.
- Agrupamento de métricas por grupo de teste (por exemplo, "Login do usuário" e "Checkout autenticado").

Esse relatório pode ser aberto diretamente no navegador (Chrome, Edge, etc.) e é uma evidência visual importante para análise e apresentação do trabalho.

---

## 8. Checklist de conceitos implementados

Resumo dos conceitos exigidos no trabalho e onde eles aparecem no projeto:

- **Thresholds**  
  - Arquivos: `test/k6/config/thresholds.js`, `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado.

- **Checks**  
  - Arquivos: `test/k6/helpers/auth.helper.js`, `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado.

- **Helpers**  
  - Arquivos: `test/k6/helpers/auth.helper.js`, `test/k6/helpers/data.helper.js`  
  - Situação: Implementado.

- **Trends**  
  - Arquivos: `test/k6/config/trends.js`, `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado.

- **Faker / Dados dinâmicos**  
  - Arquivo: `test/k6/helpers/data.helper.js`  
  - Situação: Implementado com geração manual de dados (substituindo a biblioteca Faker descontinuada).

- **Variáveis de Ambiente**  
  - Arquivos: `test/k6/tests/api-performance.test.js`, `test/k6/helpers/auth.helper.js`  
  - Situação: Implementado (uso de `__ENV.API_URL`).

- **Stages**  
  - Arquivo: `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado (três estágios: ramp-up, steady e ramp-down).

- **Reaproveitamento de Resposta**  
  - Arquivo: `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado (token de login sendo reutilizado no checkout).

- **Uso de Token de Autenticação**  
  - Arquivos: `test/k6/helpers/auth.helper.js`, `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado (header `Authorization: Bearer`).

- **Data-Driven Testing**  
  - Arquivos: `test/k6/data/users.data.js`, `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado (lista de usuários em `SharedArray` e seleção por VU).

- **Groups**  
  - Arquivo: `test/k6/tests/api-performance.test.js`  
  - Situação: Implementado (groups para login e checkout).

- **Relatório HTML**  
  - Scripts e saída: script `perf:test:html` e arquivo `test/k6/report.html`  
  - Situação: Implementado.


