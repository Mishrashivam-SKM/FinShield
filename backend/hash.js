const bcrypt = require('bcryptjs');

console.log(`admin: ${bcrypt.hashSync('admin123', 8)}`);
console.log(`manager: ${bcrypt.hashSync('manager123', 8)}`);
console.log(`staff: ${bcrypt.hashSync('staff123', 8)}`);
