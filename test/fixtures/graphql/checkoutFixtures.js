// -------------------------------------------------------------------
// Fixtures para a operação de checkout (boleto e cartão)
// -------------------------------------------------------------------
module.exports = {
  // Mutation Checkout (boleto)
  CHECKOUT_BOLETO_MUTATION: `
    mutation Checkout(
      $items: [CheckoutItemInput!]!
      $freight: Float!
      $paymentMethod: String!
      $cardData: CardDataInput
    ) {
      checkout(
        items: $items
        freight: $freight
        paymentMethod: $paymentMethod
        cardData: $cardData
      ) {
        userId
        freight
        paymentMethod
        valorFinal
        items {
          productId
          quantity
        }
      }
    }
  `,

  // Mutation Checkout (cartão de crédito – com desconto 5%)
  CHECKOUT_CARTAO_MUTATION: `
    mutation Checkout(
      $items: [CheckoutItemInput!]!
      $freight: Float!
      $paymentMethod: String!
      $cardData: CardDataInput!
    ) {
      checkout(
        items: $items
        freight: $freight
        paymentMethod: $paymentMethod
        cardData: $cardData
      ) {
        userId
        freight
        paymentMethod
        valorFinal
        items {
          productId
          quantity
        }
      }
    }
  `,

  // Dados de cartão (conforme README)
  CARD_DATA: {
    number: "4111111111111111",
    name: "Nome do Titular",
    expiry: "12/30",
    cvv: "123"
  },

  // Itens de exemplo (produto 1 = 100, produto 2 = 200)
  ITEMS_BOLETO: [
    { productId: 1, quantity: 2 }, // 2 × 100 = 200
    { productId: 2, quantity: 1 }  // 1 × 200 = 200
  ],

  // Mesmo conjunto, usado para cartão (para validar desconto)
  ITEMS_CARTAO: [
    { productId: 2, quantity: 1 } // 1 × 200 = 200
  ]
};
