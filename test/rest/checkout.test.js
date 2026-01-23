/**
 * TESTES REST - API de Checkout
 * Testando endpoint: POST /api/checkout
 * Baseado nos exemplos do README.md do projeto
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../rest/app');
const fixtures = require('../fixtures/checkoutFixtures');
const jwt = require('jsonwebtoken');

/**
 * Gera um token JWT válido para testes
 * Usa a mesma chave secreta do projeto
 */
function generateValidToken(userId = 1, name = 'Alice', email = 'alice@email.com') {
  return jwt.sign(
    { id: userId, name, email },
    'supersecret', // mesma chave do userService.js
    { expiresIn: '1h' }
  );
}

/**
 * SUITE DE TESTES: POST /api/checkout
 */
describe('POST /api/checkout', () => {

  /**
   * TESTE 1: Checkout com cartão de crédito
   * Produto 2: price 200 * quantity 1 = 200
   * Freight: 15
   * Total sem desconto: 215
   * Com desconto 5%: 215 * 0.95 = 204.25
   */
  it('Deve fazer checkout com cartão de crédito e aplicar desconto de 5% (exemplo README)', async () => {
    const validToken = generateValidToken(1);

    const response = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${validToken}`)
      .send(fixtures.validCheckoutCreditCard);

    // Asserções
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('valorFinal');
    expect(response.body).to.have.property('userId', 1);
    expect(response.body).to.have.property('paymentMethod', 'credit_card');

    // Validar desconto de 5% foi aplicado
    // Produto 2: 200 * 1 = 200
    // Total: 200 + 15 (frete) = 215
    // Com desconto 5%: 215 * 0.95 = 204.25
    expect(response.body.valorFinal).to.equal(204.25);
  });

  /**
   * TESTE 2: Checkout com boleto (exemplo do README)
   * Produto 1: price 100 * quantity 2 = 200
   * Freight: 20
   * Total: 220 (sem desconto)
   */
  it('Deve fazer checkout com boleto sem aplicar desconto (exemplo README)', async () => {
    const validToken = generateValidToken(1);

    const response = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${validToken}`)
      .send(fixtures.validCheckoutBoleto);

    // Asserções
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('valorFinal');
    expect(response.body).to.have.property('paymentMethod', 'boleto');

    // Validar que NÃO foi aplicado desconto
    // Produto 1: 100 * 2 = 200
    // Total: 200 + 20 (frete) = 220
    expect(response.body.valorFinal).to.equal(220.00);
  });

  /**
 * TESTE 3: Checkout com múltiplos produtos e cartão
 * Produto 1: 100 * 2 = 200
 * Produto 2: 200 * 1 = 200
 * Freight: 10
 * Total sem desconto: 410
 * Com desconto 5%: 410 * 0.95 = 389.50
 */
it('Deve fazer checkout com múltiplos produtos e aplicar desconto', async () => {
  const validToken = generateValidToken(1);

  const response = await request(app)
    .post('/api/checkout')
    .set('Authorization', `Bearer ${validToken}`)
    .send(fixtures.checkoutMultipleItemsCreditCard);

  // Asserções
  expect(response.status).to.equal(200);
  expect(response.body).to.have.property('valorFinal', 389.50);
  expect(response.body).to.have.property('paymentMethod', 'credit_card');
  expect(response.body.items).to.have.lengthOf(2);
});

  /**
   * TESTE 4: Erro ao fazer checkout se token
   */
  it('Deve retornar erro 401 ao fazer checkout sem token', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .send(fixtures.validCheckoutCreditCard);

    // Asserções
    expect(response.status).to.equal(401);
    expect(response.body).to.have.property('error');
    expect(response.body.error).to.include('Token inválido');
  });

  /**
   * TESTE 5: Erro ao fazer checkout com token inválido
   */
  it('Deve retornar erro 401 ao fazer checkout com token inválido', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .set('Authorization', 'Bearer token_invalido_xyz123')
      .send(fixtures.validCheckoutCreditCard);

    // Asserções
    expect(response.status).to.equal(401);
    expect(response.body).to.have.property('error');
    expect(response.body.error).to.include('Token inválido');
  });

  /**
   * TESTE 6: Erro ao fazer checkout com produto não encontrado
   */
  it('Deve retornar erro 400 ao tentar checkout com produto não encontrado', async () => {
    const validToken = generateValidToken(1);

    const response = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${validToken}`)
      .send(fixtures.checkoutWithInvalidProduct);

    // Asserções
    expect(response.status).to.equal(400);
    expect(response.body).to.have.property('error');
    expect(response.body.error).to.include('Produto não encontrado');
  });

  /**
   * TESTE 7: Erro ao fazer checkout com cartão sem dados do cartão
   */
  it('Deve retornar erro 400 ao tentar checkout com cartão sem dados do cartão', async () => {
    const validToken = generateValidToken(1);

    const response = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${validToken}`)
      .send(fixtures.checkoutWithoutCardData);

    // Asserções
    expect(response.status).to.equal(400);
    expect(response.body).to.have.property('error');
    expect(response.body.error).to.include('Dados do cartão obrigatórios');
  });

  /**
   * TESTE 8: Erro ao fazer checkout com quantidade zero
   */
  it('Deve retornar erro 400 ao tentar checkout com quantidade zero', async () => {
    const validToken = generateValidToken(1);

    const response = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${validToken}`)
      .send(fixtures.checkoutWithZeroQuantity);

    // Asserções
    expect(response.status).to.equal(400);
    expect(response.body).to.have.property('error');
  });

  /**
   * TESTE 9: Erro ao fazer checkout com quantidade negativa
   */
  it('Deve retornar erro 400 ao tentar checkout com quantidade negativa', async () => {
    const validToken = generateValidToken(1);

    const response = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${validToken}`)
      .send(fixtures.checkoutWithNegativeQuantity);

    // Asserções
    expect(response.status).to.equal(400);
    expect(response.body).to.have.property('error');
  });

});
