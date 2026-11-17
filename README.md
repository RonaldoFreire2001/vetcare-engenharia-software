# VetCare — Sistema de Gestão Veterinária (Trabalho II — Engenharia de Software 1)

**Instituição:** Universidade Federal da Bahia (UFBA) — Instituto de Computação[cite: 9]  
**Docente:** Profa. Dra. Larissa Barbosa Leôncio Pinheiro[cite: 9]  
**Discentes:** Eduardo Barreto; Ronaldo Freire[cite: 1]  

## 1. Escopo Implementado (Sprint 1 — ~30% dos Requisitos Funcionais)
Do conjunto de 17 requisitos funcionais mapeados na Etapa 1[cite: 2, 3], foram selecionados e implementados **5 requisitos (~29,4%)**[cite: 9]:
- **REQ 01:** Autenticação de usuários via JWT[cite: 2, 3].
- **REQ 03:** Controle de acesso centralizado por perfil (`ADMIN`, `RECEP`, `VET`)[cite: 2, 3].
- **REQ 04:** Cadastro e listagem de Tutores[cite: 2].
- **REQ 05:** Cadastro e listagem de Animais com vínculo relacional ao Tutor[cite: 2].
- **REQ 07:** Agendamento de consultas com validação de conflito de horário por veterinário[cite: 2, 3, 7].

## 2. Arquitetura Aplicada e Desvios (ADRs)
O sistema segue o estilo **Monolito Modular** (`br.ufba.vetcare`) definido na Etapa 1[cite: 4], organizado nos pacotes `config`, `shared`, `modules/identity`, `modules/tutores_animais` e `modules/agendamento`[cite: 4].

### Desvios registrados[cite: 9]:
- **ADR-04 (Simplificação do API Gateway):** O roteamento, verificação de token JWT e autorização por perfil foram centralizados nos middlewares internos do Express (`config/authMiddleware.js`)[cite: 3, 4], postergando um API Gateway dedicado para reduzir complexidade operacional na Sprint 1.
- **ADR-05 (Postergação de Cache em Memória):** As consultas da agenda utilizam índices compostos diretamente no PostgreSQL (`idx_consultas_data_vet`)[cite: 5], adiando o uso de Redis para evitar sobrecarga de invalidação de cache neste estágio inicial.

## 3. Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (v18+)
- Projeto no Supabase (PostgreSQL) com as tabelas `usuarios`, `tutores`, `animais` e `consultas` criadas.

### Passo 1: Backend
```bash
cd backend
npm install
cp .env.example .env
# Preencha SUPABASE_URL e SUPABASE_KEY no arquivo .env
node src/server.js