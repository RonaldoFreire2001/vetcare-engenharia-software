const jwt = require('jsonwebtoken');

function verificarToken(perfisPermitidos = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido.' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decoded;

      if (perfisPermitidos.length > 0 && !perfisPermitidos.includes(decoded.perfil)) {
        return res.status(403).json({ erro: 'Acesso negado para o perfil: ' + decoded.perfil });
      }
      next();
    } catch (err) {
      return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
  };
}

module.exports = { verificarToken };