const express = require('express');
const cors = require('cors');
require('dotenv').config();

const identityRoutes = require('./modules/identity/identityRoutes');
const tutoresAnimaisRoutes = require('./modules/tutores_animais/tutoresAnimaisRoutes');
const agendamentoRoutes = require('./modules/agendamento/agendamentoRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Roteamento modular (br.ufba.vetcare)
app.use('/auth', identityRoutes);
app.use('/api', tutoresAnimaisRoutes);
app.use('/api', agendamentoRoutes);

app.get('/', (req, res) => res.json({ status: 'VetCare API rodando!' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor VetCare rodando na porta ${PORT}`));