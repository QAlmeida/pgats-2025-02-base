const products = require('../models/product');
const users = require('../models/user');

function calculateTotal(items, freight, paymentMethod) {
  let total = 0;
  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new Error('Produto não encontrado');
    total += product.price * item.quantity;
  }
  total += freight;
  if (paymentMethod === 'credit_card') {
    total *= 0.95; // 5% de desconto
  }
  return parseFloat(total.toFixed(2));
}

function checkout(userId, items, freight, paymentMethod, cardData) {
  // Validar quantidade
  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }
  }

  if (paymentMethod === 'credit_card' && !cardData) {
    throw new Error('Dados do cartão obrigatórios para pagamento com cartão');
  }

  // Simula o registro do pedido
  const total = calculateTotal(items, freight, paymentMethod);
  return { userId, items, freight, paymentMethod, total };
}
module.exports = { calculateTotal, checkout };
