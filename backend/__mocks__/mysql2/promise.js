const bcrypt = require('bcryptjs');

const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password_hash: bcrypt.hashSync('admin123', 8),
    role: 'admin'
  }
];

const mockPool = {
  query: jest.fn(async (sql, params) => {
    if (sql.includes('SELECT * FROM users WHERE username = ?')) {
      const u = mockUsers.filter(user => user.username === params[0]);
      return [u];
    }
    return [[]]; // Default empty result
  })
};

module.exports = {
  createPool: jest.fn(() => mockPool)
};
