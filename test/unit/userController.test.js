/**
 * TESTES UNITÁRIOS - userController
 * Usando Sinon para mockar services e validar comportamento do controller
 */

const { expect } = require('chai');
const sinon = require('sinon');
const userController = require('../../rest/controllers/userController');
const userService = require('../../src/services/userService');

/**
 * SUITE DE TESTES: userController
 */
describe('userController', () => {

  /**
   * Limpar todos os stubs após cada teste
   */
  afterEach(() => {
    sinon.restore();
  });

  /**
   * SUITE: POST /api/users/register
   */
  describe('register()', () => {

    /**
     * TESTE 1: Deve retornar 201 quando registro é bem-sucedido
     * Valida que o controller retorna status 201 e dados do usuário
     */
    it('Deve retornar 201 e dados do usuário quando registro é bem-sucedido', () => {
      // ARRANGE
      const mockRegisteredUser = {
        name: 'Alice',
        email: 'alice@email.com'
      };

      const req = {
        body: {
          name: 'Alice',
          email: 'alice@email.com',
          password: '123456'
        }
      };

      const res = {
        status: sinon.stub().returns({
          json: sinon.spy()
        }),
        json: sinon.spy()
      };

      // Mockar userService.registerUser para retornar usuário registrado
      sinon.stub(userService, 'registerUser').returns(mockRegisteredUser);

      // ACT
      userController.register(req, res);

      // ASSERT
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.status().json.calledOnce).to.be.true;
    });

    /**
     * TESTE 2: Deve chamar userService.registerUser com os parâmetros corretos
     * Valida que o controller passa name, email e password
     */
    it('Deve chamar userService.registerUser com name, email e password', () => {
      // ARRANGE
      const req = {
        body: {
          name: 'Bob',
          email: 'bob@email.com',
          password: 'senha123'
        }
      };

      const res = {
        status: sinon.stub().returns({ json: sinon.spy() }),
        json: sinon.spy()
      };

      const registerStub = sinon.stub(userService, 'registerUser').returns({
        name: 'Bob',
        email: 'bob@email.com'
      });

      // ACT
      userController.register(req, res);

      // ASSERT
      expect(registerStub.calledOnce).to.be.true;
      expect(registerStub.firstCall.args[0]).to.equal('Bob'); // name
      expect(registerStub.firstCall.args[1]).to.equal('bob@email.com'); // email
      expect(registerStub.firstCall.args[2]).to.equal('senha123'); // password
    });

    /**
     * TESTE 3: Deve retornar 400 quando email já existe
     * Valida que o controller rejeita registro com email duplicado
     */
    it('Deve retornar 400 quando email já existe (userService.registerUser retorna null)', () => {
      // ARRANGE
      const req = {
        body: {
          name: 'Alice',
          email: 'alice@email.com', // Email já registrado
          password: '123456'
        }
      };

      const res = {
        status: sinon.stub().returns({ json: sinon.spy() }),
        json: sinon.spy()
      };

      // Mockar registerUser para retornar null (email já existe)
      sinon.stub(userService, 'registerUser').returns(null);

      // ACT
      userController.register(req, res);

      // ASSERT
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.status().json.firstCall.args[0]).to.deep.include({
        error: 'Email já cadastrado'
      });
    });

  });

  /**
   * SUITE: POST /api/users/login
   */
  describe('login()', () => {

    /**
     * TESTE 4: Deve retornar 200 e token quando login é bem-sucedido
     * Valida que o controller retorna status 200 e token JWT
     */
    it('Deve retornar 200 e token quando login é bem-sucedido', () => {
      // ARRANGE
      const mockAuthResult = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      };

      const req = {
        body: {
          email: 'alice@email.com',
          password: '123456'
        }
      };

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returns({ json: sinon.spy() })
      };

      // Mockar userService.authenticate para retornar token
      sinon.stub(userService, 'authenticate').returns(mockAuthResult);

      // ACT
      userController.login(req, res);

      // ASSERT
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal(mockAuthResult);
      expect(res.json.firstCall.args[0]).to.have.property('token');
    });

    /**
     * TESTE 5: Deve chamar userService.authenticate com email e password corretos
     * Valida que o controller passa os parâmetros corretos
     */
    it('Deve chamar userService.authenticate com email e password', () => {
      // ARRANGE
      const req = {
        body: {
          email: 'alice@email.com',
          password: '123456'
        }
      };

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returns({ json: sinon.spy() })
      };

      const authenticateStub = sinon.stub(userService, 'authenticate').returns({
        token: 'jwt_token_here'
      });

      // ACT
      userController.login(req, res);

      // ASSERT
      expect(authenticateStub.calledOnce).to.be.true;
      expect(authenticateStub.firstCall.args[0]).to.equal('alice@email.com'); // email
      expect(authenticateStub.firstCall.args[1]).to.equal('123456'); // password
    });

    /**
     * TESTE 6: Deve retornar 401 quando credenciais são inválidas
     * Valida que o controller rejeita login com email/senha incorretos
     */
    it('Deve retornar 401 quando credenciais são inválidas (userService.authenticate retorna null)', () => {
      // ARRANGE
      const req = {
        body: {
          email: 'alice@email.com',
          password: 'senha_errada'
        }
      };

      const res = {
        status: sinon.stub().returns({ json: sinon.spy() }),
        json: sinon.spy()
      };

      // Mockar authenticate para retornar null (credenciais inválidas)
      sinon.stub(userService, 'authenticate').returns(null);

      // ACT
      userController.login(req, res);

      // ASSERT
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.status().json.firstCall.args[0]).to.deep.include({
        error: 'Credenciais inválidas'
      });
    });

  });

});
