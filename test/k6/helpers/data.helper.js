// Geração de dados aleatórios para teste

const nomes = [
  'João Silva',
  'Maria Santos',
  'Pedro Oliveira',
  'Ana Costa',
  'Carlos Souza',
  'Juliana Lima',
  'Rafael Almeida',
  'Fernanda Rocha',
  'Lucas Martins',
  'Beatriz Ferreira',
];

const metodosPagamento = ['boleto', 'credit_card'];

export function randomCheckout() {
  const usarCartao = Math.random() > 0.5; // 50% boleto, 50% cartão

  return {
    items: [
      { 
        productId: 1, 
        quantity: Math.floor(Math.random() * 3) + 1 // 1-3 unidades
      },
      { 
        productId: 2, 
        quantity: Math.floor(Math.random() * 2) + 1 // 1-2 unidades
      },
    ],
    freight: Math.floor(Math.random() * 31) + 10, // Frete entre 10-40
    paymentMethod: usarCartao ? 'credit_card' : 'boleto',
    cardData: usarCartao ? {
      number: '4111111111111111',
      name: nomes[Math.floor(Math.random() * nomes.length)], // Nome aleatório
      expiry: '12/30',
      cvv: '123',
    } : null,
  };
}

export function randomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `user${timestamp}${random}@pgats.com`;
}

export function randomName() {
  return nomes[Math.floor(Math.random() * nomes.length)];
}
