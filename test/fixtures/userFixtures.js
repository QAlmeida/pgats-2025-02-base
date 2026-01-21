/**
 * FIXTURES - Dados de teste reutilizáveis
 */

const validUser = {
  name: 'Julio Lima',
  email: 'julio@pgats.com',
  password: 'senha123'
};

const validUserLogin = {
  email: 'julio@pgats.com',
  password: 'senha123'
};

const anotherUser = {
  name: 'Marina Sena',
  email: 'marina@papito.com',
  password: 'senha456'
};

const anotherUserLogin = {
  email: 'marina@papito.com',
  password: 'senha456'
};

const userWithoutEmail = {
  name: 'Pedro Costa',
  password: 'senha789'
};

const userWithoutPassword = {
  name: 'Ana Lima',
  email: 'ana@pgats.com'
};

module.exports = {
  validUser,
  validUserLogin,
  anotherUser,
  anotherUserLogin,
  userWithoutEmail,
  userWithoutPassword
};
