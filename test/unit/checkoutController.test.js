/**
 * TESTES UNITÁRIOS - checkoutController
 * Usando Sinon para mockar services e validar comportamento do controller
 */

const { expect } = require('chai');
const sinon = require('sinon');
const checkoutController = require('../../rest/controllers/checkoutController');
const checkoutService = require('../../src/services/checkoutService');
const userService = require('../../src/services/userService');

/**
 * SUITE DE TESTES: checkoutController.checkout()
 */
describe('checkoutController.checkout()', () => {

  /**
   * Limpar todos os stubs após cada teste
   */
  afterEach(() => {
    sinon.restore();
  });

  /**
   * TESTE 1: Deve fazer checkout com sucesso quando token e dados são válidos
   * Valida que o controller retorna 200 e chama o service corretamente
   */
  it('Deve retornar 200 e valorFinal quando checkout é bem-sucedido', () => {
    const mockUserData = { id: 1, email: 'alice@email.com' };
    const mockCheckoutResult = {
      userId: 1,
      items: [{ productId: 1, quantity: 2 }],
      freight: 20,
      paymentMethod: 'boleto',
      total: 220
    };

    const req = {
      headers: {
        authorization: 'Bearer valid_token_123'
      },
      body: {
        items: [{ productId: 1, quantity: 2 }],
        freight: 20,
        paymentMethod: 'boleto',
        cardData: null
      }
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({
        json: sinon.spy()
      })
    };

    // Mockar userService.verifyToken para retornar usuário válido
    sinon.stub(userService, 'verifyToken').returns(mockUserData);

    // Mockar checkoutService.checkout para retornar resultado válido
    sinon.stub(checkoutService, 'checkout').returns(mockCheckoutResult);

    // ACT: Executar o controller
    checkoutController.checkout(req, res);

    // ASSERT: Validar comportamento
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.deep.include({
      valorFinal: 220,
      userId: 1,
      paymentMethod: 'boleto'
    });
  });

  /**
   * TESTE 2: Deve chamar verifyToken com o token correto
   * Valida que o controller extrai e passa o token corretamente
   */
  it('Deve chamar userService.verifyToken com o token extraído do header', () => {
    const mockUserData = { id: 1, email: 'alice@email.com' };
    const token = 'valid_token_xyz';

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      },
      body: {
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'boleto',
        cardData: null
      }
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    };

    const verifyTokenStub = sinon.stub(userService, 'verifyToken').returns(mockUserData);
    sinon.stub(checkoutService, 'checkout').returns({ total: 110 });

    // ACT
    checkoutController.checkout(req, res);

    // ASSERT
    expect(verifyTokenStub.calledOnce).to.be.true;
    expect(verifyTokenStub.firstCall.args[0]).to.equal(token);
  });

  /**
   * TESTE 3: Deve chamar checkoutService.checkout com os parâmetros corretos
   * Valida que o controller passa userId, items, freight, paymentMethod e cardData
   */
  it('Deve chamar checkoutService.checkout com userId, items, freight, paymentMethod e cardData', () => {
    const mockUserData = { id: 1, email: 'alice@email.com' };
    const checkoutData = {
      items: [{ productId: 2, quantity: 1 }],
      freight: 15,
      paymentMethod: 'credit_card',
      cardData: {
        number: '4111111111111111',
        name: 'Nome do Titular',
        expiry: '12/30',
        cvv: '123'
      }
    };

    const req = {
      headers: { authorization: 'Bearer valid_token' },
      body: checkoutData
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    };

    sinon.stub(userService, 'verifyToken').returns(mockUserData);
    const checkoutStub = sinon.stub(checkoutService, 'checkout').returns({ total: 204.25 });

    // ACT
    checkoutController.checkout(req, res);

    // ASSERT
    expect(checkoutStub.calledOnce).to.be.true;
    expect(checkoutStub.firstCall.args[0]).to.equal(1); // userId
    expect(checkoutStub.firstCall.args[1]).to.deep.equal(checkoutData.items); // items
    expect(checkoutStub.firstCall.args[2]).to.equal(15); // freight
    expect(checkoutStub.firstCall.args[3]).to.equal('credit_card'); // paymentMethod
    expect(checkoutStub.firstCall.args[4]).to.deep.equal(checkoutData.cardData); // cardData
  });

  /**
   * TESTE 4: Deve retornar 401 quando token é inválido
   * Valida que o controller rejeita requisições com token inválido
   */
  it('Deve retornar 401 quando userService.verifyToken retorna null (token inválido)', () => {
    const req = {
      headers: { authorization: 'Bearer invalid_token' },
      body: {
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'boleto',
        cardData: null
      }
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    };

    // Mockar verifyToken para retornar null (token inválido)
    sinon.stub(userService, 'verifyToken').returns(null);

    // ACT
    checkoutController.checkout(req, res);

    // ASSERT
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.status().json.calledOnce).to.be.true;
    expect(res.status().json.firstCall.args[0]).to.deep.include({
      error: 'Token inválido'
    });
  });

  /**
   * TESTE 5: Deve retornar 401 quando Authorization header não é fornecido
   * Valida que o controller rejeita requisições sem token
   */
  it('Deve retornar 401 quando Authorization header não é fornecido', () => {
    const req = {
      headers: {}, // Sem authorization header
      body: {
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'boleto',
        cardData: null
      }
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    };

    sinon.stub(userService, 'verifyToken').returns(null);

    // ACT
    checkoutController.checkout(req, res);

    // ASSERT
    expect(res.status.calledWith(401)).to.be.true;
    expect(res.status().json.firstCall.args[0]).to.deep.include({
      error: 'Token inválido'
    });
  });

  /**
   * TESTE 6: Deve retornar 400 quando checkoutService lança erro
   * Valida que o controller trata erros do service corretamente
   */
  it('Deve retornar 400 quando checkoutService.checkout lança erro', () => {
    const mockUserData = { id: 1, email: 'alice@email.com' };
    const errorMessage = 'Produto não encontrado';

    const req = {
      headers: { authorization: 'Bearer valid_token' },
      body: {
        items: [{ productId: 999, quantity: 1 }], // Produto inexistente
        freight: 10,
        paymentMethod: 'credit_card',
        cardData: {
          number: '4111111111111111',
          name: 'Test',
          expiry: '12/30',
          cvv: '123'
        }
      }
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    };

    sinon.stub(userService, 'verifyToken').returns(mockUserData);
    // Mockar checkoutService para lançar erro
    sinon.stub(checkoutService, 'checkout').throws(new Error(errorMessage));

    // ACT
    checkoutController.checkout(req, res);

    // ASSERT
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.status().json.calledOnce).to.be.true;
    expect(res.status().json.firstCall.args[0]).to.deep.include({
      error: errorMessage
    });
  });

  /**
   * TESTE 7: Deve retornar 400 quando dados do cartão são obrigatórios mas não fornecidos
   * Valida que o controller trata erro de cartão obrigatório
   */
  it('Deve retornar 400 quando cartão é obrigatório mas cardData não é fornecido', () => {
    const mockUserData = { id: 1, email: 'alice@email.com' };
    const errorMessage = 'Dados do cartão obrigatórios para pagamento com cartão';

    const req = {
      headers: { authorization: 'Bearer valid_token' },
      body: {
        items: [{ productId: 1, quantity: 1 }],
        freight: 10,
        paymentMethod: 'credit_card',
        cardData: null // Faltando dados do cartão
      }
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    };

    sinon.stub(userService, 'verifyToken').returns(mockUserData);
    sinon.stub(checkoutService, 'checkout').throws(new Error(errorMessage));

    // ACT
    checkoutController.checkout(req, res);

    // ASSERT
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.status().json.firstCall.args[0]).to.deep.include({
      error: errorMessage
    });
  });

  /**
   * TESTE 8: Deve retornar desconto de 5% quando pagamento é com cartão
   * Valida que o controller retorna o valor final correto com desconto aplicado
   */
  it('Deve retornar valorFinal com desconto de 5% quando paymentMethod é credit_card', () => {
    const mockUserData = { id: 1, email: 'alice@email.com' };
    const mockCheckoutResult = {
      userId: 1,
      items: [{ productId: 2, quantity: 1 }],
      freight: 15,
      paymentMethod: 'credit_card',
      total: 204.25 // 200 + 15 = 215; 215 * 0.95 = 204.25
    };

    const req = {
      headers: { authorization: 'Bearer valid_token' },
      body: {
        items: [{ productId: 2, quantity: 1 }],
        freight: 15,
        paymentMethod: 'credit_card',
        cardData: {
          number: '4111111111111111',
          name: 'Nome do Titular',
          expiry: '12/30',
          cvv: '123'
        }
      }
    };

    const res = {
      json: sinon.spy(),
      status: sinon.stub().returns({ json: sinon.spy() })
    };

    sinon.stub(userService, 'verifyToken').returns(mockUserData);
    sinon.stub(checkoutService, 'checkout').returns(mockCheckoutResult);

    // ACT
    checkoutController.checkout(req, res);

    // ASSERT
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0].valorFinal).to.equal(204.25);
  });

});
