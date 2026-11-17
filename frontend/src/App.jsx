import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const assets = {
  cross: '/assets/cross.svg',
  careLine: '/assets/care-line.svg',
  mail: '/assets/mail.svg',
  eyeOff: '/assets/eye-off.svg',
  shield: '/assets/shield.svg',
  vet: '/assets/vet.png',
};

async function request(path, options = {}) {
  const token = localStorage.getItem('vetcare_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.erro || 'Não foi possível concluir a operação.');
  }
  return body;
}

function Brand() {
  return (
    <div className="brand reference-brand" aria-label="VetCare">
      <span className="brand-mark"><img src={assets.cross} alt="" /></span>
      <span>VetCare</span>
    </div>
  );
}

function WelcomePanel() {
  return (
    <aside className="welcome-panel">
      <Brand />
      <div className="welcome-copy">
        <p className="eyebrow">GESTÃO VETERINÁRIA, COM CUIDADO</p>
        <h1>Cada consulta faz parte de uma história.</h1>
        <p className="lead">Da agenda ao prontuário, uma visão contínua do cuidado — para quem cuida todos os dias.</p>
      </div>
      <img className="vet-photo" src={assets.vet} alt="Veterinária examinando um cachorro durante uma consulta" />
      <div className="care-path" aria-label="Etapas do cuidado">
        <div className="care-line"><img src={assets.careLine} alt="" /></div>
        <div className="care-labels"><span>Consulta</span><span>Registro</span><span>Acompanhamento</span></div>
      </div>
      <p className="panel-note">VetCare · Cuidado presente em cada etapa.</p>
    </aside>
  );
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      localStorage.setItem('vetcare_token', session.token);
      localStorage.setItem('vetcare_user', JSON.stringify(session.usuario));
      onLogin(session.usuario);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page reference-login">
      <WelcomePanel />
      <section className="auth-panel">
        <div className="auth-content">
          <header className="auth-intro">
            <p className="eyebrow">ACESSO DA EQUIPE</p>
            <h2>Bem-vindo de volta.</h2>
            <p>Entre com sua conta da clínica para continuar.</p>
          </header>
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <label className="field">
              <span>E-mail</span>
              <span className="input-wrap">
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required />
                <img src={assets.mail} alt="" />
              </span>
            </label>
            <label className="field">
              <span>Senha</span>
              <span className="input-wrap">
                <input type={showPassword ? 'text' : 'password'} value={form.senha} onChange={(event) => setForm({ ...form, senha: event.target.value })} autoComplete="current-password" required />
                <button className={`visibility-button ${showPassword ? 'is-visible' : ''}`} type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                  <img src={assets.eyeOff} alt="" />
                </button>
              </span>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
          </form>
          <div className="divider" />
          <section className="access-info">
            <div className="access-heading"><img src={assets.shield} alt="" /><h2>Seu perfil acompanha sua conta</h2></div>
            <p>Administrador, Recepcionista ou Veterinário: o perfil é definido pela clínica após a autenticação.</p>
            <p className="restriction">A recepção acessa a agenda, mas não os diagnósticos ou registros clínicos.</p>
            <p className="small">As permissões são verificadas de forma centralizada conforme o perfil vinculado à conta.</p>
          </section>
          <footer className="support"><p>Precisa de acesso? Fale com o administrador da clínica.</p><p>Demonstração · dados fictícios</p></footer>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vetcare_user')) || null;
    } catch {
      return null;
    }
  });
  const [section, setSection] = useState('agenda');

  function logout() {
    localStorage.removeItem('vetcare_token');
    localStorage.removeItem('vetcare_user');
    setUser(null);
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <Dashboard
      user={user}
      section={section}
      onSectionChange={setSection}
      onLogout={logout}
    />
  );
}

function Dashboard({ user, section, onSectionChange, onLogout }) {
  const [toast, setToast] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }

  const content = {
    'visao-geral': <Overview user={user} refreshKey={refreshKey} onNavigate={onSectionChange} />,
    tutores: <Tutors onNotify={notify} />,
    animais: <Animals onNotify={notify} />,
    agenda: <Schedule user={user} onNotify={notify} refreshKey={refreshKey} canOpenRecord={user.perfil === 'VET'} onOpenRecord={(animal) => {
      if (user.perfil !== 'VET') {
        notify('Acesso ao prontuário disponível apenas para veterinários.');
        return;
      }
      setSelectedAnimal(animal);
      onSectionChange('prontuario');
    }} />,
    prontuario: <Prontuario animal={selectedAnimal} user={user} onBack={() => onSectionChange('agenda')} onNotify={notify} />,
  }[section];

  return (
    <div className="clinic-shell">
      <header className="clinic-header">
        <Brand />
        <nav className="clinic-nav" aria-label="Navegação principal">
          <button className={section === 'agenda' ? 'active' : ''} onClick={() => onSectionChange('agenda')}>Agenda</button>
          <button className={section === 'tutores' ? 'active' : ''} onClick={() => onSectionChange('tutores')}>Tutores</button>
          <button className={section === 'animais' ? 'active' : ''} onClick={() => onSectionChange('animais')}>Animais</button>
          {user.perfil === 'VET' && <button className={section === 'prontuario' ? 'active' : ''} onClick={() => onSectionChange('prontuario')}>Prontuário</button>}
        </nav>
        <div className="profile">
          <span className="profile-copy"><strong>{user.nome}</strong><small>{roleLabel(user.perfil)} · CRMV-SP 42.816</small></span>
          <span className="profile-avatar">{user.nome?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
          <button className="header-logout" onClick={onLogout}>Sair</button>
        </div>
      </header>
      {toast && <div className="toast" role="status">{toast}</div>}
      <main className="clinic-content">{content}</main>
      <footer className="clinic-footer"><span>VetCare · Clínica veterinária</span><span>Demonstração · dados fictícios</span></footer>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span>{icon}</span>{label}</button>;
}

function Overview({ user, onNavigate, refreshKey }) {
  const [data, setData] = useState({ agenda: [], animais: [], error: '' });
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    Promise.all([request(`/api/agenda?data=${today}`), request('/api/animais')])
      .then(([agenda, animais]) => setData({ agenda, animais, error: '' }))
      .catch((error) => setData((current) => ({ ...current, error: error.message })));
  }, [today, refreshKey]);

  return (
    <>
      <div className="welcome-row">
        <div><h2>Olá, {user.nome?.split(' ')[0]}!</h2><p className="muted">Aqui está o resumo da sua clínica hoje.</p></div>
        <button className="button primary" onClick={() => onNavigate('agenda')}>+ Nova consulta</button>
      </div>
      {data.error && <p className="error-message">{data.error}</p>}
      <div className="stats-grid">
        <StatCard label="Consultas hoje" value={data.agenda.length} icon="□" />
        <StatCard label="Animais cadastrados" value={data.animais.length} icon="♡" />
        <StatCard label="Próximo atendimento" value={formatTime(data.agenda[0]?.data_hora) || '--:--'} icon="◷" />
      </div>
      <section className="panel">
        <div className="panel-heading"><div><h2>Agenda de hoje</h2><p className="muted">{formatDate(today)}</p></div><button className="text-button" onClick={() => onNavigate('agenda')}>Ver agenda completa →</button></div>
        {data.agenda.length === 0 ? <EmptyState text="Nenhuma consulta agendada para hoje." /> : <AppointmentList items={data.agenda.slice(0, 5)} />}
      </section>
    </>
  );
}

function StatCard({ label, value, icon }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><div><span className="muted">{label}</span><strong>{value}</strong></div></div>;
}

function Tutors({ onNotify }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cpf: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  function load() { request('/api/tutores').then(setItems).catch((error) => setError(error.message)); }
  useEffect(load, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await request('/api/tutores', { method: 'POST', body: JSON.stringify(form) });
      setForm({ nome: '', telefone: '', email: '', cpf: '' });
      setShowForm(false);
      onNotify('Tutor cadastrado com sucesso.');
      load();
    } catch (submitError) { setError(submitError.message); }
  }

  return <section className="panel">
    <div className="panel-heading"><div><h2>Tutores</h2><p className="muted">Gerencie os responsáveis pelos animais.</p></div><button className="button primary" onClick={() => setShowForm(!showForm)}>+ Novo tutor</button></div>
    {showForm && <EntityForm title="Cadastrar tutor" fields={['nome', 'telefone', 'email', 'cpf']} values={form} onChange={setForm} onSubmit={submit} onCancel={() => setShowForm(false)} />}
    {error && <p className="error-message">{error}</p>}
    <div className="table-wrap"><table><thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>CPF</th></tr></thead><tbody>
      {items.map((item) => <tr key={item.id}><td><strong>{item.nome}</strong></td><td>{item.telefone || '—'}</td><td>{item.email || '—'}</td><td>{item.cpf || '—'}</td></tr>)}
    </tbody></table>{items.length === 0 && <EmptyState text="Nenhum tutor cadastrado." />}</div>
  </section>;
}

function Animals({ onNotify }) {
  const [items, setItems] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [form, setForm] = useState({ nome: '', especie: '', raca: '', idade: '', peso: '', tutor_id: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  function load() { request('/api/animais').then(setItems).catch((error) => setError(error.message)); }
  useEffect(() => { load(); request('/api/tutores').then(setTutors).catch(() => {}); }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await request('/api/animais', { method: 'POST', body: JSON.stringify({ ...form, idade: Number(form.idade), peso: Number(form.peso), tutor_id: form.tutor_id }) });
      setForm({ nome: '', especie: '', raca: '', idade: '', peso: '', tutor_id: '' });
      setShowForm(false);
      onNotify('Animal cadastrado com sucesso.');
      load();
    } catch (submitError) { setError(submitError.message); }
  }

  return <section className="panel">
    <div className="panel-heading"><div><h2>Animais</h2><p className="muted">Acompanhe os pacientes cadastrados.</p></div><button className="button primary" onClick={() => setShowForm(!showForm)}>+ Novo animal</button></div>
    {showForm && <form className="entity-form" onSubmit={submit}><h3>Cadastrar animal</h3><div className="form-grid">
      {['nome', 'especie', 'raca', 'idade', 'peso'].map((field) => <label key={field}>{fieldLabel(field)}<input type={['idade', 'peso'].includes(field) ? 'number' : 'text'} min="0" step={field === 'peso' ? '0.1' : '1'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} required={['nome', 'especie'].includes(field)} /></label>)}
      <label>Tutor<select value={form.tutor_id} onChange={(event) => setForm({ ...form, tutor_id: event.target.value })} required><option value="">Selecione</option>{tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.nome}</option>)}</select></label>
    </div><FormActions onCancel={() => setShowForm(false)} /></form>}
    {error && <p className="error-message">{error}</p>}
    <div className="table-wrap"><table><thead><tr><th>Animal</th><th>Espécie</th><th>Raça</th><th>Tutor</th><th>Peso</th></tr></thead><tbody>
      {items.map((item) => <tr key={item.id}><td><strong>{item.nome}</strong></td><td>{item.especie || '—'}</td><td>{item.raca || '—'}</td><td>{item.tutores?.nome || '—'}</td><td>{item.peso ? `${item.peso} kg` : '—'}</td></tr>)}
    </tbody></table>{items.length === 0 && <EmptyState text="Nenhum animal cadastrado." />}</div>
  </section>;
}

function Schedule({ user, onNotify, refreshKey, canOpenRecord, onOpenRecord }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [vets, setVets] = useState([]);
  const [form, setForm] = useState({ animal_id: '', veterinario_id: '', data_hora: '', tipo: 'Consulta' });
  const [error, setError] = useState('');
  const availableSlot = findAvailableSlot(appointments);
  const scheduleRows = getScheduleRows(appointments);

  function load() { request(`/api/agenda?data=${date}`).then(setAppointments).catch((error) => setError(error.message)); }
  useEffect(() => { load(); }, [date, refreshKey]);
  useEffect(() => { Promise.all([request('/api/animais'), request('/auth/veterinarios')]).then(([animalsData, vetsData]) => { setAnimals(animalsData); setVets(vetsData); }).catch((error) => setError(error.message)); }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await request('/api/consultas', { method: 'POST', body: JSON.stringify(form) });
      setForm({ animal_id: '', veterinario_id: '', data_hora: '', tipo: 'Consulta' });
      onNotify('Consulta agendada com sucesso.');
      load();
    } catch (submitError) { setError(submitError.message); }
  }

  async function cancel(id) {
    if (!window.confirm('Deseja cancelar esta consulta?')) return;
    try { await request(`/api/consultas/${id}/cancelar`, { method: 'PATCH' }); onNotify('Consulta cancelada.'); load(); } catch (cancelError) { setError(cancelError.message); }
  }

  return <section className="schedule-page">
    <div className="schedule-heading">
      <div><p className="eyebrow">AGENDA DA CLÍNICA</p><h1>Agenda de consultas</h1><p>Organize o dia e acompanhe cada atendimento.</p></div>
      <span className="role-pill">◉ Perfil: {roleLabel(user?.perfil)}</span>
    </div>
    <div className="agenda-toolbar">
      <button className="today-button" onClick={() => setDate(new Date().toISOString().slice(0, 10))}>Hoje</button>
      <button className="date-arrow" onClick={() => shiftDate(date, -1, setDate)}>‹</button>
      <strong>{formatLongDate(date)}</strong>
      <button className="date-arrow" onClick={() => shiftDate(date, 1, setDate)}>›</button>
      <div className="view-toggle"><button className="selected">Dia</button><button>Semana</button></div>
      <span className="toolbar-spacer" />
      <span className="professional-label">Profissional</span>
      <strong>{user?.nome || 'Veterinário'}⌄</strong>
    </div>
    {error && <p className="error-message">{error}</p>}
    <div className="schedule-grid">
      <section className="day-card">
        <div className="day-card-heading"><div><h2>Manhã · 08:00 às 12:00</h2><p>{user?.nome || 'Equipe VetCare'} · sala 02</p></div><span>{appointments.length} consultas · {availableSlot ? '1 horário livre' : 'sem horários livres'}</span></div>
        <div className="day-appointments">
          {appointments.length === 0 && <EmptyState text="Nenhuma consulta para esta data." />}
          {scheduleRows.map((row) => row.type === 'free'
            ? <div className="free-slot" key={`free-${row.time}`}><time>{row.time}</time><div><strong>Horário disponível</strong><small>{user?.nome || 'Dra. Helena Martins'} · 30 min livres para agendamento</small></div><span>＋ Livre</span></div>
            : <ScheduleRow key={row.item.id} item={row.item} canOpenRecord={canOpenRecord} onOpenRecord={onOpenRecord} onCancel={cancel} />)}
        </div>
        <div className="afternoon-note">◷ &nbsp; Tarde · 14:00 às 18:00 · sem consultas agendadas</div>
      </section>
      <aside className="booking-card">
        <div className="booking-heading"><h2>Novo agendamento</h2><p>Agende ou retorne de um paciente.</p></div>
        <form onSubmit={submit} className="booking-form">
          <label>Animal *<select value={form.animal_id} onChange={(event) => setForm({ ...form, animal_id: event.target.value })} required><option value="">Selecione um animal</option>{animals.map((animal) => <option key={animal.id} value={animal.id}>{animal.nome} · {animal.especie}</option>)}</select></label>
          <label>Tutor vinculado *<input value={animals.find((animal) => String(animal.id) === String(form.animal_id))?.tutores?.nome || ''} placeholder="Selecione o animal" readOnly /></label>
          <small className="form-hint">◉ Animal e tutor conferidos no cadastro</small>
          <label>Veterinário *<select value={form.veterinario_id} onChange={(event) => setForm({ ...form, veterinario_id: event.target.value })} required><option value="">Selecione</option>{vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.nome}</option>)}</select></label>
          <div className="booking-two-columns"><label>Data *<input type="date" value={form.data_hora.split('T')[0] || date} onChange={(event) => setForm({ ...form, data_hora: `${event.target.value}T${form.data_hora.split('T')[1] || '10:00'}` })} required /></label><label>Hora *<input type="time" value={form.data_hora.split('T')[1] || ''} onChange={(event) => setForm({ ...form, data_hora: `${form.data_hora.split('T')[0] || date}T${event.target.value}` })} required /></label></div>
          <label>Tipo e duração<select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}><option>Retorno · 30 minutos</option><option>Consulta · 30 minutos</option><option>Vacinação · 30 minutos</option></select></label>
          <div className="booking-summary">◷ &nbsp; {form.data_hora ? `${formatShortDate(form.data_hora)} · horário selecionado` : 'Selecione data e horário'}<small>O conflito de horário será verificado ao confirmar.</small></div>
          <label className="check-label"><input type="checkbox" defaultChecked /> Enviar lembrete de consulta ao tutor</label>
          <button className="primary-button compact-button">▣ &nbsp; Confirmar agendamento</button>
        </form>
      </aside>
    </div>
    <p className="privacy-note">♙ &nbsp; Abrir prontuário está disponível apenas para o perfil Veterinário autorizado. A recepção não acessa dados clínicos.</p>
  </section>;
}

function ScheduleRow({ item, canOpenRecord, onOpenRecord, onCancel }) {
  const status = item.status === 'CANCELADA' ? 'Cancelada' : item.status === 'CONFIRMADA' ? 'Confirmada' : 'Em atendimento';
  return <article className={`schedule-row ${item.status === 'CANCELADA' ? 'row-cancelled' : ''}`}>
    <time>{formatTime(item.data_hora)}</time>
    <div className="schedule-row-main"><strong>{item.animais?.nome || 'Animal não informado'} · {item.animais?.especie || 'Paciente'}</strong><small>{item.animais?.tutores?.nome || 'Tutor não informado'} · {item.tipo || 'Consulta'} · 30 min</small>
      {item.status !== 'CANCELADA' && <div className="row-actions">{canOpenRecord && <button onClick={() => onOpenRecord(item.animais)}>Abrir prontuário →</button>}<button onClick={() => onCancel(item.id)}>Cancelar consulta</button><small>Consulta #{String(item.id).slice(0, 8)}</small></div>}
    </div>
    <span className={`schedule-status ${item.status === 'CANCELADA' ? 'status-cancelled' : ''}`}>✓ &nbsp;{status}</span>
  </article>;
}

function AppointmentList({ items, onCancel }) {
  return <div className="appointment-list">{items.map((item) => <article className={`appointment ${item.status === 'CANCELADA' ? 'cancelled' : ''}`} key={item.id}>
    <div className="appointment-time"><strong>{formatTime(item.data_hora)}</strong><span>{item.tipo}</span></div>
    <div className="appointment-main"><strong>{item.animais?.nome || 'Animal não informado'}</strong><span>{item.animais?.tutores?.nome || 'Tutor não informado'} · Dr(a). {item.usuarios?.nome || 'Não informado'}</span></div>
    <span className={`badge ${item.status === 'CANCELADA' ? 'badge-red' : 'badge-green'}`}>{item.status}</span>
    {onCancel && item.status !== 'CANCELADA' && <button className="icon-button" title="Cancelar consulta" onClick={() => onCancel(item.id)}>×</button>}
  </article>)}</div>;
}

function Prontuario({ animal, user, onBack, onNotify }) {
  const patient = animal || { nome: 'Luna', especie: 'Canina', raca: 'Golden retriever', idade: 4, peso: 28.4, tutores: { nome: 'Marina Oliveira', telefone: '(11) 99842-7310' } };
  const recordId = animal?.id ? String(animal.id).slice(0, 8) : '0284';

  return <section className="record-page">
    <button className="back-link" onClick={onBack}>‹ Voltar à agenda · {formatShortDate(new Date())}</button>
    <div className="record-title-row"><div><h1>Prontuário de {patient.nome}</h1></div><span className="role-pill">♙ Acesso clínico restrito</span></div>
    <section className="patient-card">
      <div className="patient-avatar">♧</div>
      <div className="patient-name"><h2>{patient.nome}</h2><p>{patient.especie || 'Canina'} · {patient.raca || 'Sem raça'} · fêmea · {patient.idade || 4} anos</p><small>Cadastro #{recordId} · {patient.peso || '28,4'} kg · cadastrada</small></div>
      <div className="patient-divider" />
      <div className="patient-meta"><small>TUTORA VINCULADA</small><strong>{patient.tutores?.nome || 'Marina Oliveira'}</strong><span>{patient.tutores?.telefone || '(11) 99842-7310'}</span></div>
      <div className="patient-meta"><small>CONSULTA #1048 · SALA 02</small><strong>{formatShortDate(new Date())} · 09:00–09:30</strong><span>{user?.nome || 'Dra. Helena Martins'} · Dermatologia</span></div>
    </section>
    <div className="record-notice">♧ &nbsp; Política de acesso: somente profissionais autorizados. A abertura do prontuário deve registrar usuário, data e hora para auditoria.</div>
    <div className="record-grid">
      <aside className="care-line-card"><h2>Linha do cuidado</h2><p>Consultas e registros conectados.</p><div className="timeline">
        <div className="timeline-item current"><small>08 OUT 2026 · 09:00</small><strong>Consulta dermatológica</strong><span>{user?.nome || 'Helena Martins'} · consulta atual</span><b>Atendimento atual →</b></div>
        <div className="timeline-item"><small>12 SET 2026</small><strong>Retorno de rotina</strong><span>Sem alterações clínicas. Peso: 28,1 kg.</span></div>
        <div className="timeline-item"><small>10 ABR 2026</small><strong>Vacinação anual</strong><span>V10 e antirrábica registradas.</span></div>
        <div className="timeline-item"><small>15 JAN 2026</small><strong>Avaliação geral</strong><span>Exame físico sem alterações.</span></div>
      </div><small className="timeline-foot">Registros anteriores preservados no histórico do animal.</small></aside>
      <section className="current-visit">
        <div className="visit-heading"><div><h2>Atendimento atual</h2><p>{formatShortDate(new Date())} · 09:00 · {user?.nome || 'Dra. Helena Martins'}</p></div><span className="schedule-status">◉ Em atendimento</span></div>
        <div className="visit-field"><strong>Queixa e anamnese</strong><p>Tutora relata coceira nas patas e abdômen há 5 dias. Apetite e ingestão de água preservados. Sem mudança recente na alimentação.</p></div>
        <div className="vitals"><div><small>Peso</small><strong>{patient.peso || '28,4'} kg</strong></div><div><small>Temperatura</small><strong>38,5 °C</strong></div><div><small>Freq. cardíaca</small><strong>92 bpm</strong></div></div>
        <div className="visit-field"><strong>Exame físico</strong><p>Paciente alerta. Eritema leve em região interdigital e abdominal; sem secreção ou lesões ulceradas. Demais parâmetros sem alterações.</p></div>
        <div className="visit-field"><strong>Diagnóstico / hipótese clínica</strong><p>Suspeita de dermatite alérgica. Investigar fatores ambientais e resposta ao tratamento tópico.</p></div>
        <div className="visit-field"><strong>Conduta e acompanhamento</strong><p>Higiene tópica conforme prescrição. Observar evolução do prurido e retornar em 7 dias; antecipar se houver piora ou novas lesões.</p></div>
        <div className="visit-actions"><button className="orange-button" onClick={() => onNotify('Registro salvo em edição.')}>▣ &nbsp; Salvar registro</button><button className="outline-button" onClick={() => onNotify('Atendimento concluído.')}>Concluir atendimento</button></div>
        <small className="save-note">Registro em edição · salve antes de concluir o atendimento.</small>
      </section>
      <aside className="record-aside">
        <section className="record-side-card"><h2>♧ &nbsp; Vacinação</h2><small>ÚLTIMAS DOSES · 10/04/2026</small><div className="side-item"><strong>V10 · reforço anual</strong><span>Lote V10-28041 · {user?.nome || 'Helena Martins'}</span></div><div className="side-item"><strong>Antirrábica · reforço anual</strong><span>Lote AR-26018 · {user?.nome || 'Helena Martins'}</span></div><div className="next-dose"><strong>Próximo reforço: 10/04/2027</strong><span>Lembrete de vacina previsto para a tutora.</span></div><button className="outline-button full">＋ &nbsp; Registrar vacina</button></section>
        <section className="record-side-card prescription"><h2>▧ &nbsp; Prescrição</h2><span className="draft-badge">✎ Rascunho · consulta #1048</span><strong>Shampoo veterinário com clorexidina 2%</strong><p>Uso externo. Aplicar nas áreas afetadas 2 vezes por semana, por 14 dias. Enxaguar após 10 minutos.</p><small>Evitar contato com olhos e mucosas. Reavaliar em 7 dias.</small><hr /><span>Responsável: {user?.nome || 'Dra. Helena Martins'} · CRMV-SP 42.816</span><button className="orange-button full">♧ &nbsp; Emitir prescrição</button></section>
      </aside>
    </div>
  </section>;
}

function EntityForm({ title, fields, values, onChange, onSubmit, onCancel }) {
  return <form className="entity-form" onSubmit={onSubmit}><h3>{title}</h3><div className="form-grid">{fields.map((field) => <label key={field}>{fieldLabel(field)}<input type={field === 'email' ? 'email' : 'text'} value={values[field]} onChange={(event) => onChange({ ...values, [field]: event.target.value })} required={field === 'nome'} /></label>)}</div><FormActions onCancel={onCancel} /></form>;
}

function FormActions({ onCancel }) { return <div className="form-actions"><button type="button" className="button secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="button primary">Salvar</button></div>; }
function EmptyState({ text }) { return <div className="empty-state">{text}</div>; }
function roleLabel(role) { return ({ ADMIN: 'Administrador', RECEP: 'Recepcionista', VET: 'Veterinário' })[role] || role; }
function pageTitle(section) { return ({ 'visao-geral': 'Visão geral', tutores: 'Tutores', animais: 'Animais', agenda: 'Agenda' })[section]; }
function fieldLabel(field) { return ({ nome: 'Nome', telefone: 'Telefone', email: 'E-mail', cpf: 'CPF', especie: 'Espécie', raca: 'Raça', idade: 'Idade', peso: 'Peso (kg)' })[field] || field; }
function formatTime(value) { return value ? new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''; }
function formatDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }); }
function formatLongDate(value) { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); }
function formatShortDate(value) { return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function findAvailableSlot(appointments) {
  const slots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const occupied = new Set(appointments.map((appointment) => formatTime(appointment.data_hora)));
  return slots.find((slot) => !occupied.has(slot)) || '';
}
function getScheduleRows(appointments) {
  const rows = appointments.map((item) => ({ type: 'appointment', time: formatTime(item.data_hora), item }));
  const availableSlot = findAvailableSlot(appointments);
  if (availableSlot) rows.push({ type: 'free', time: availableSlot });
  return rows.sort((left, right) => left.time.localeCompare(right.time));
}
function shiftDate(value, amount, setDate) {
  const next = new Date(`${value}T12:00:00`);
  next.setDate(next.getDate() + amount);
  setDate(next.toISOString().slice(0, 10));
}

export default App;
