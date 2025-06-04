const bcrypt = require('bcryptjs');
const connection = require('../config/db');

const hashedPassword = bcrypt.hashSync('contraseña123', 8);

connection.query(
  'INSERT INTO usuarios (username, password) VALUES (?, ?)',
  ['bioquimico1', hashedPassword],
  (err, result) => {
    if (err) throw err;
    console.log('Usuario insertado con éxito');
    connection.end();
  }
);
