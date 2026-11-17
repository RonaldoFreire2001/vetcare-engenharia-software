const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../../shared/supabase');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, crmv')
    .eq('email', email)
    .eq('senha', senha)
    .single();

  if (error || !usuario) {
    console.log('ERRO SUPABASE LOGIN:', error);
    return res.status(401).json({ erro: error?.message || 'E-mail ou senha inválidos.' });
  }
  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, usuario });
});

router.get('/veterinarios', async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, crmv')
    .eq('perfil', 'VET');
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});

module.exports = router;