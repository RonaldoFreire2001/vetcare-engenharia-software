const express = require('express');
const supabase = require('../../shared/supabase');
const { verificarToken } = require('../../config/authMiddleware');
const router = express.Router();

// Consultar agenda
router.get('/agenda', verificarToken(), async (req, res) => {
  const { data } = req.query; // filtro opcional YYYY-MM-DD
  let query = supabase
    .from('consultas')
    .select(`
      id, data_hora, tipo, status,
      animais ( id, nome, especie, raca, tutores ( nome, telefone ) ),
      usuarios ( id, nome, crmv )
    `)
    .order('data_hora', { ascending: true });

  if (data) {
    query = query.gte('data_hora', `${data}T00:00:00`).lte('data_hora', `${data}T23:59:59`);
  }

  const { data: consultas, error } = await query;
  if (error) return res.status(500).json({ erro: error.message });
  res.json(consultas);
});

// Agendar consulta com verificação de choque de horário (REQ 07)
router.post('/consultas', verificarToken(['ADMIN', 'RECEP', 'VET']), async (req, res) => {
  const { animal_id, veterinario_id, data_hora, tipo } = req.body;

  // 1. Verifica conflito de horário no mesmo veterinário
  const { data: conflito } = await supabase
    .from('consultas')
    .select('id')
    .eq('veterinario_id', veterinario_id)
    .eq('data_hora', data_hora)
    .neq('status', 'CANCELADA');

  if (conflito && conflito.length > 0) {
    return res.status(409).json({ erro: 'Conflito de horário: este veterinário já possui consulta nesse horário.' });
  }

  // 2. Insere agendamento
  const { data, error } = await supabase
    .from('consultas')
    .insert([{ animal_id, veterinario_id, data_hora, tipo, status: 'CONFIRMADA' }])
    .select()
    .single();

  if (error) return res.status(400).json({ erro: error.message });
  res.status(201).json(data);
});

// Cancelar consulta
router.patch('/consultas/:id/cancelar', verificarToken(['ADMIN', 'RECEP', 'VET']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('consultas')
    .update({ status: 'CANCELADA' })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(400).json({ erro: error.message });
  res.json(data);
});

module.exports = router;