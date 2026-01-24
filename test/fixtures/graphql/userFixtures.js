// -------------------------------------------------------------------
// Fixtures para as operações de usuário (register, login, users)
// -------------------------------------------------------------------
module.exports = {
  // Mutation Register
  REGISTER_MUTATION: `
    mutation Register($name: String!, $email: String!, $password: String!) {
      register(name: $name, email: $email, password: $password) {
        name
        email
      }
    }
  `,

  // Mutation Login
  LOGIN_MUTATION: `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
      }
    }
  `,

  // Query Users
  USERS_QUERY: `
    query Users {
      users {
        name
        email
      }
    }
  `
};
