/**
 * TESTES REST - API de Usuários
 * Testando endpoints: POST /api/users/register e POST /api/users/login
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../rest/app');
const fixtures = require('../fixtures/userFixtures');

// Importar o array de usuários
const users = require('../../src/models/user');

/**
 * SUITE DE TESTES: POST /api/users/register
 */
describe('POST /api/users/register', () => {

  /**
   * Restaura o array para o estado inicial
   */
  beforeEach(() => {
    // Limpa o array de usuários
    users.length = 0;

    // Restaura os usuários padrão
    users.push(
      { id: 1, name: 'Alice', email: 'alice@email.com', password: '123456' },
      { id: 2, name: 'Bob', email: 'bob@email.com', password: '123456' }
    );
  });

  /**
   * TESTE 1: Registro com sucesso
   */
  it('Deve registrar um novo usuário com sucesso', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send(fixtures.validUser);

    // Asserções
    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('user');
    expect(response.body.user).to.have.property('name', fixtures.validUser.name);
    expect(response.body.user).to.have.property('email', fixtures.validUser.email);
    expect(response.body.user).to.not.have.property('password');
  });

  /**
   * TESTE 2: Tentar registrar com email duplicado
   */
  it('Deve retornar erro ao registrar com email duplicado', async () => {
    // Primeiro registro (vai funcionar)
    await request(app)
      .post('/api/users/register')
      .send(fixtures.validUser);

    // Segundo registro com mesmo email (deve falhar)
    const response = await request(app)
      .post('/api/users/register')
      .send(fixtures.validUser);

    // Asserções
    expect(response.status).to.equal(400);
    expect(response.body).to.have.property('error');
    expect(response.body.error).to.include('Email já cadastrado');
  });

  /**
   * TESTE 3: Registrar sem email
   * A API atual aceita registro sem email
   */
  it('Deve aceitar registro sem email (comportamento atual)', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send(fixtures.userWithoutEmail);

    // A API não valida campos obrigatórios
    // Este teste documenta o comportamento atual
    expect(response.status).to.equal(201);
  });

});

/**
 * SUITE DE TESTES: POST /api/users/login
 */
describe('POST /api/users/login', () => {

  /**
   * Restaura o array para o estado inicial
   */
  beforeEach(() => {
    users.length = 0;
    users.push(
      { id: 1, name: 'Alice', email: 'alice@email.com', password: '123456' },
      { id: 2, name: 'Bob', email: 'bob@email.com', password: '123456' }
    );
  });

  /**
   * TESTE 4: Login com sucesso
   */
  it('Deve fazer login com sucesso e retornar token', async () => {
    // Passo 1: Registrar um usuário
    await request(app)
      .post('/api/users/register')
      .send(fixtures.anotherUser);

    // Passo 2: Fazer login
    const response = await request(app)
      .post('/api/users/login')
      .send(fixtures.anotherUserLogin);

    // Asserções
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('token');
    expect(response.body.token).to.be.a('string');
    expect(response.body.token.split('.')).to.have.lengthOf(3);
  });

  /**
   * TESTE 5: Login com credenciais inválidas
   */
  it('Deve retornar erro ao fazer login com credenciais inválidas', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'naoexiste@test.com',
        password: 'qualquersenha'
      });

    // Asserções
    expect(response.status).to.equal(401);
    expect(response.body).to.have.property('error');
    expect(response.body.error).to.include('Credenciais inválidas');
  });

  /**
   * TESTE 6: Login com senha incorreta
   */
  it('Deve retornar erro ao fazer login com senha incorreta', async () => {
    // Passo 1: Registrar usuário
    await request(app)
      .post('/api/users/register')
      .send(fixtures.validUser);

    // Passo 2: Tentar login com senha errada
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: fixtures.validUser.email,
        password: 'senhaErrada123'
      });

    // Asserções
    expect(response.status).to.equal(401);
    expect(response.body).to.have.property('error');
  });

});
