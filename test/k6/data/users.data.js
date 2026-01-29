import { SharedArray } from 'k6/data';

export const users = new SharedArray('users', () => {
  return [
    { email: 'alice@pgats.com', password: '123456' },
    { email: 'bob@pgats.com', password: '123456' },
    { email: 'carol@pgats.com', password: '123456' },
    { email: 'david@pgats.com', password: '123456' },
    { email: 'iuri@pgats.com', password: '123456' },
  ];
});
