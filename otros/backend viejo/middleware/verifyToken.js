const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(403).send('Token no proporcionado');

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Token inválido');
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  });
}

module.exports = verifyToken;
