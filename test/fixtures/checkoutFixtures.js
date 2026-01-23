/**
 * FIXTURES - Dados de Teste para Checkout
 * Baseado nos exemplos do README.md do projeto
 */

// Checkout com cartão de crédito (exemplo do README)
const validCheckoutCreditCard = {
  items: [
    { productId: 2, quantity: 1 }
  ],
  freight: 15,
  paymentMethod: 'credit_card',
  cardData: {
    number: '4111111111111111',
    name: 'Nome do Titular',
    expiry: '12/30',
    cvv: '123'
  }
};

// Checkout com boleto (exemplo do README)
const validCheckoutBoleto = {
  items: [
    { productId: 1, quantity: 2 }
  ],
  freight: 20,
  paymentMethod: 'boleto',
  cardData: null
};

// Checkout com múltiplos produtos e cartão (CORRIGIDO)
const checkoutMultipleItemsCreditCard = {
  items: [
    { productId: 1, quantity: 2 },
    { productId: 2, quantity: 1 }
  ],
  freight: 10,
  paymentMethod: 'credit_card',
  cardData: {
    number: '4111111111111111',
    name: 'Nome do Titular',
    expiry: '12/30',
    cvv: '123'
  }
};

// Checkout com cartão sem dados do cartão (deve falhar)
const checkoutWithoutCardData = {
  items: [
    { productId: 1, quantity: 1 }
  ],
  freight: 10,
  paymentMethod: 'credit_card',
  cardData: null
};

// Checkout com produto inexistente (deve falhar)
const checkoutWithInvalidProduct = {
  items: [
    { productId: 999, quantity: 1 }
  ],
  freight: 10,
  paymentMethod: 'credit_card',
  cardData: {
    number: '4111111111111111',
    name: 'Nome do Titular',
    expiry: '12/30',
    cvv: '123'
  }
};

// Checkout com quantidade zero (deve falhar)
const checkoutWithZeroQuantity = {
  items: [
    { productId: 1, quantity: 0 }
  ],
  freight: 10,
  paymentMethod: 'credit_card',
  cardData: {
    number: '4111111111111111',
    name: 'Nome do Titular',
    expiry: '12/30',
    cvv: '123'
  }
};

// Checkout com quantidade negativa (deve falhar)
const checkoutWithNegativeQuantity = {
  items: [
    { productId: 1, quantity: -1 }
  ],
  freight: 10,
  paymentMethod: 'credit_card',
  cardData: {
    number: '4111111111111111',
    name: 'Nome do Titular',
    expiry: '12/30',
    cvv: '123'
  }
};

module.exports = {
  validCheckoutCreditCard,
  validCheckoutBoleto,
  checkoutMultipleItemsCreditCard,
  checkoutWithoutCardData,
  checkoutWithInvalidProduct,
  checkoutWithZeroQuantity,
  checkoutWithNegativeQuantity
};
