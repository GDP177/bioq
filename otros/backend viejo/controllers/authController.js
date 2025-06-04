const connection = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM usuarios WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).send('Error en el servidor');
    if (results.length === 0) return res.status(404).send('Usuario no encontrado');

    const user = results[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).send('Contraseña incorrecta');

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET, { expiresIn: '1d' });
    res.status(200).json({ auth: true, token });
  });
};
