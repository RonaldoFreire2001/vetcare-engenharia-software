const express = require('express');
const supabase = require('../../shared/supabase');
const { verificarToken } = require('../../config/authMiddleware');
const router = express.Router();

// --- TUTORES (REQ 04) ---
router.get('/tutores', verificarToken(), async (req, res) => {
  const { data, error } = await supabase.from('tutores').select('*').order('nome');
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});

router.post('/tutores', verificarToken(['ADMIN', 'RECEP', 'VET']), async (req, res) => {
  const { nome, telefone, email, cpf } = req.body;
  const { data, error } = await supabase
    .from('tutores')
    .insert([{ nome, telefone, email, cpf }])
    .select()
    .single();
  if (error) return res.status(400).json({ erro: error.message });
  res.status(201).json(data);
});

// --- ANIMAIS (REQ 05) ---
router.get('/animais', verificarToken(), async (req, res) => {
  const { data, error } = await supabase
    .from('animais')
    .select('*, tutores(id, nome, telefone)')
    .order('nome');
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});

router.post('/animais', verificarToken(['ADMIN', 'RECEP', 'VET']), async (req, res) => {
  const { nome, especie, raca, idade, peso, tutor_id } = req.body;
  const { data, error } = await supabase
    .from('animais')
    .insert([{ nome, especie, raca, idade, peso, tutor_id }])
    .select()
    .single();
  if (error) return res.status(400).json({ erro: error.message });
  res.status(201).json(data);
});

module.exports = router;