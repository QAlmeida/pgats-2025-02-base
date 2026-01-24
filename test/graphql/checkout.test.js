/**
 * TESTES GRAPHQL – Checkout (boleto e cartão)
 * Usa Supertest + Chai
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../graphql/app');
const userService = require('../../src/services/userService');
const {
  CHECKOUT_BOLETO_MUTATION,
  CHECKOUT_CARTAO_MUTATION,
  CARD_DATA,
  ITEMS_BOLETO,
  ITEMS_CARTAO
} = require('../fixtures/graphql/checkoutFixtures');

describe('GraphQL – Checkout', () => {
  // Resetar usuários antes de cada teste
  beforeEach(() => {
    const users = require('../../src/models/user');
    users.length = 0;
  });

  /** Helper – cria usuário e devolve token JWT */
  async function getAuthToken() {
    // registra usuário
    await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation Register($name: String!, $email: String!, $password: String!) {
            register(name: $name, email: $email, password: $password) { email }
          }
        `,
        variables: { name: 'TestUser', email: 'test@ex.com', password: 'pwd' }
      });

    // login para obter token
    const loginRes = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) { token }
          }
        `,
        variables: { email: 'test@ex.com', password: 'pwd' }
      });

    return loginRes.body.data.login.token;
  }

  /** CT06 – Checkout boleto (sem cartão) */
  it('CT06 – Deve fazer checkout com boleto e retornar valor final correto', async () => {
    const token = await getAuthToken();

    const variables = {
      items: ITEMS_BOLETO,
      freight: 10,
      paymentMethod: 'boleto',
      cardData: null
    };

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: CHECKOUT_BOLETO_MUTATION, variables });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.be.undefined;

    const data = res.body.data.checkout;
    // cálculo esperado: (2*100 + 1*200) + 10 = 410
    expect(data.valorFinal).to.equal(410);
    expect(data.paymentMethod).to.equal('boleto');
    expect(data.freight).to.equal(10);
    expect(data.items).to.deep.equal(ITEMS_BOLETO);
  });

  /** CT07 – Checkout cartão (aplica 5% de desconto) */
  it('CT07 – Deve fazer checkout com cartão e aplicar 5% de desconto', async () => {
    const token = await getAuthToken();

    const variables = {
      items: ITEMS_CARTAO,
      freight: 15,
      paymentMethod: 'credit_card',
      cardData: CARD_DATA
    };

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: CHECKOUT_CARTAO_MUTATION, variables });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.be.undefined;

    const data = res.body.data.checkout;
    // cálculo: (1*200) + 15 = 215 → 5% de desconto → 204.25
    expect(data.valorFinal).to.equal(204.25);
    expect(data.paymentMethod).to.equal('credit_card');
    expect(data.freight).to.equal(15);
    expect(data.items).to.deep.equal(ITEMS_CARTAO);
  });

  /** CT08 – Falha quando token JWT não é enviado */
  it('CT08 – Deve retornar erro quando token JWT está ausente', async () => {
    const variables = {
      items: ITEMS_BOLETO,
      freight: 10,
      paymentMethod: 'boleto',
      cardData: null
    };

    const res = await request(app)
      .post('/graphql')
      .send({ query: CHECKOUT_BOLETO_MUTATION, variables });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.have.lengthOf(1);
    expect(res.body.errors[0].message).to.equal('Token inválido');
  });

  /** CT09 – Falha quando produto não existe */
  it('CT09 – Deve retornar erro ao tentar checkout com produto inexistente', async () => {
    const token = await getAuthToken();

    const variables = {
      items: [{ productId: 999, quantity: 1 }], // produto inexistente
      freight: 10,
      paymentMethod: 'boleto',
      cardData: null
    };

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: CHECKOUT_BOLETO_MUTATION, variables });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.have.lengthOf(1);
    expect(res.body.errors[0].message).to.equal('Produto não encontrado');
  });

    /**
   * CT10 – Deve retornar erro quando pagamento é cartão e cardData está ausente
   */
  it('CT10 – Deve retornar erro quando pagamento é cartão e cardData está ausente', async () => {
    // ARRANGE
    const token = await getAuthToken();
    const mutation = `
      mutation Checkout($items: [CheckoutItemInput!]!, $freight: Float!, $paymentMethod: String!, $cardData: CardDataInput) {
        checkout(items: $items, freight: $freight, paymentMethod: $paymentMethod, cardData: $cardData) {
          valorFinal
          paymentMethod
          userId
        }
      }
    `;

    const variables = {
      items: [{ productId: 1, quantity: 1 }],
      freight: 10,
      paymentMethod: 'credit_card',
      cardData: null // Faltando dados do cartão
    };

    // ACT
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: mutation, variables });

    // ASSERT
    expect(response.status).to.equal(200); // GraphQL sempre retorna 200
    expect(response.body).to.have.property('errors'); // Mas com errors
    expect(response.body.errors).to.be.an('array');
    expect(response.body.errors[0].message).to.include('Dados do cartão obrigatórios');
  });

});
