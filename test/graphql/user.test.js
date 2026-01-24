/**
 * TESTES GRAPHQL – Usuários (register, login, users)
 * Usa Supertest + Chai + Sinon
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../graphql/app'); // exporta o Express app sem listen()
const userService = require('../../src/services/userService');
const { REGISTER_MUTATION, LOGIN_MUTATION, USERS_QUERY } = require('../fixtures/graphql/userFixtures');

describe('GraphQL – Usuários', () => {
  // Limpar a base de usuários em memória antes de cada teste
  beforeEach(() => {
    // O modelo user está em src/models/user.js (array em memória)
    const users = require('../../src/models/user');
    users.length = 0; // resetar
  });

  /** CT01 – Registro de usuário com sucesso */
  it('CT01 – Deve registrar usuário e retornar name/email', async () => {
    const variables = {
      name: 'Julio',
      email: 'julio@abc.com',
      password: '123456'
    };

    const res = await request(app)
      .post('/graphql')
      .send({ query: REGISTER_MUTATION, variables });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.be.undefined;
    const data = res.body.data.register;
    expect(data).to.deep.equal({ name: 'Julio', email: 'julio@abc.com' });
  });

  /** CT02 – Registro falha quando email já existe */
  it('CT02 – Deve retornar erro ao registrar email já cadastrado', async () => {
    // Primeiro registro (para criar o email)
    await request(app)
      .post('/graphql')
      .send({
        query: REGISTER_MUTATION,
        variables: { name: 'Ana', email: 'ana@email.com', password: 'pwd' }
      });

    // Segundo registro com o mesmo email
    const res = await request(app)
      .post('/graphql')
      .send({
        query: REGISTER_MUTATION,
        variables: { name: 'Ana2', email: 'ana@email.com', password: 'pwd2' }
      });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.have.lengthOf(1);
    expect(res.body.errors[0].message).to.equal('Email já cadastrado');
  });

  /** CT03 – Login bem‑sucedido */
  it('CT03 – Deve fazer login e retornar token JWT', async () => {
    // Primeiro cria o usuário
    await request(app)
      .post('/graphql')
      .send({
        query: REGISTER_MUTATION,
        variables: { name: 'Bob', email: 'bob@email.com', password: 'pwd' }
      });

    // Tenta login
    const res = await request(app)
      .post('/graphql')
      .send({
        query: LOGIN_MUTATION,
        variables: { email: 'bob@email.com', password: 'pwd' }
      });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.be.undefined;
    const token = res.body.data.login.token;
    expect(token).to.be.a('string').and.to.have.length.greaterThan(10);
  });

  /** CT04 – Login falha com credenciais inválidas */
  it('CT04 – Deve retornar erro ao fazer login com senha errada', async () => {
    // Cria usuário
    await request(app)
      .post('/graphql')
      .send({
        query: REGISTER_MUTATION,
        variables: { name: 'Carol', email: 'carol@email.com', password: 'pwd' }
      });

    // Tenta login com senha errada
    const res = await request(app)
      .post('/graphql')
      .send({
        query: LOGIN_MUTATION,
        variables: { email: 'carol@email.com', password: 'wrong' }
      });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.have.lengthOf(1);
    expect(res.body.errors[0].message).to.equal('Credenciais inválidas');
  });

  /** CT05 – Consulta de usuários (query) */
  it('CT05 – Deve retornar lista de usuários cadastrados', async () => {
    // Cria dois usuários
    await request(app)
      .post('/graphql')
      .send({
        query: REGISTER_MUTATION,
        variables: { name: 'Alice', email: 'alice@email.com', password: 'pwd' }
      });
    await request(app)
      .post('/graphql')
      .send({
        query: REGISTER_MUTATION,
        variables: { name: 'Bob', email: 'bob@email.com', password: 'pwd' }
      });

    const res = await request(app)
      .post('/graphql')
      .send({ query: USERS_QUERY });

    expect(res.status).to.equal(200);
    expect(res.body.errors).to.be.undefined;
    const users = res.body.data.users;
    expect(users).to.be.an('array').with.lengthOf(2);
    expect(users).to.deep.include.members([
      { name: 'Alice', email: 'alice@email.com' },
      { name: 'Bob', email: 'bob@email.com' }
    ]);
  });
});
