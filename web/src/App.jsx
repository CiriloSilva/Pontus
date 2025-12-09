import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const BACKEND = (window.__BACKEND__ || 'http://127.0.0.1:3000');

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@pontus.local');
  const [password, setPassword] = useState('pontusadmin123');
  async function submit() {
    const res = await axios.post(BACKEND + '/api/auth/login', { email, password });
    onLogin(res.data);
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="senha" />
      <button onClick={submit}>Login</button>
    </div>
  );
}

function CreateUser({ token, onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  async function submit() {
    if (!name || !email || !password) return alert('preencha todos os campos');
    try {
      const res = await axios.post(BACKEND + '/api/users', { name, email, password, role }, { headers: { Authorization: 'Bearer ' + token } });
      alert('Usuário criado: ' + res.data.email);
      setName(''); setEmail(''); setPassword(''); setRole('user');
      onCreated && onCreated();
    } catch (e) {
      alert('Erro ao criar: ' + (e.response?.data?.error || String(e)));
    }
  }
  return (
    <div style={{display:'flex', gap:8, marginTop:12, marginBottom:12, alignItems:'center'}}>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome" />
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" />
      <select value={role} onChange={e=>setRole(e.target.value)}>
        <option value="user">Usuário</option>
        <option value="admin">Administrador</option>
      </select>
      <button onClick={submit}>Criar usuário</button>
    </div>
  );
}

function Associate({ token, users, backend, onAssociated }) {
  const [uid, setUid] = useState('');
  const [userId, setUserId] = useState(users?.[0]?.id || '');
  async function submit() {
    if (!userId || !uid) return alert('uid + user required');
    try {
      await axios.post(backend + '/api/users/' + userId + '/associate-uid', { uid }, { headers: { Authorization: 'Bearer ' + token } });
      alert('Associado com sucesso');
      onAssociated && onAssociated();
    } catch (e) { alert('Falha: ' + (e.response?.data?.error || String(e))); }
  }
  async function unassociate() {
    if (!uid) return alert('Coloque o UID para desassociar');
    if (!confirm('Deseja desassociar o UID ' + uid + ' ?')) return;
    try {
      await axios.delete(backend + '/api/cards/' + encodeURIComponent(uid), { headers: { Authorization: 'Bearer ' + token } });
      alert('UID desassociado com sucesso');
      setUid('');
      onAssociated && onAssociated();
    } catch (e) { alert('Falha ao desassociar: ' + (e.response?.data?.error || String(e))); }
  }
  return (
    <div style={{display:'flex',gap:8}}>
      <input value={uid} onChange={e=>setUid(e.target.value)} placeholder="UID (ex: 04AABBCC)" />
      <select value={userId} onChange={e=>setUserId(e.target.value)}>
        {users.map(u=>(<option key={u.id} value={u.id}>{u.name}</option>))}
      </select>
      <button onClick={submit}>Associar</button>
      <button onClick={unassociate} style={{background:'#c53030'}}>Desassociar</button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [rows, setRows] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const [users, setUsers] = useState([]);
  const pollRef = useRef(null);
  const backend = BACKEND;

  // restore session from localStorage
  useEffect(()=> {
    const t = localStorage.getItem('pontus_token');
    const u = localStorage.getItem('pontus_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
      fetchUsers(t);
      fetchRegs(t);
      startPolling(t);
    }
    // cleanup on unmount
    return () => stopPolling();
  }, []);

  async function onLogin(data) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('pontus_token', data.token);
    localStorage.setItem('pontus_user', JSON.stringify(data.user));
    fetchUsers(data.token);
    fetchRegs(data.token);
    startPolling(data.token);
  }

  function startPolling(t) {
    stopPolling();
    pollRef.current = setInterval(()=> {
      fetchRegs(t);
    }, 3000);
  }
  function stopPolling() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }

  async function fetchUsers(t) {
    try { const res = await axios.get(backend + '/api/users', { headers: { Authorization: 'Bearer ' + t } }); setUsers(res.data); }
    catch(e){ console.error('fetchUsers', e); }
  }

  async function fetchRegs(t) {
    try {
      const params = {};
      if (filterUser) params.userId = filterUser;
      const res = await axios.get(backend + '/api/registros', { headers: { Authorization: 'Bearer ' + t }, params });
      setRows(res.data.rows || []);
    } catch (e) {
      console.error('fetchRegs', e);
      // se 401, deslogar
      if (e.response?.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        doLogout();
      }
    }
  }

  function doLogout() {
    setUser(null); setToken('');
    localStorage.removeItem('pontus_token'); localStorage.removeItem('pontus_user');
    stopPolling();
  }

  async function exportCSV() {
    if (!token) return alert('faça login como admin');
    try {
      const res = await axios.get(backend + '/api/registros/export.csv', {
        headers: { Authorization: 'Bearer ' + token },
        params: filterUser ? { userId: filterUser } : {},
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registros.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar CSV: ' + (e.response?.data?.error || e.message || String(e)));
    }
  }

  return (
    <div style={{fontFamily:'Inter, system-ui, Arial',maxWidth:980,margin:'24px auto',padding:16}}>
      <h1 style={{marginBottom:8}}>Pontus — Admin</h1>
      {!user ? <Login onLogin={onLogin} /> : (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>Logado como: <strong>{user.name}</strong> ({user.role})</div>
            <div>
              <button onClick={doLogout}>Logout</button>
            </div>
          </div>

          {user.role==='admin' && <CreateUser token={token} onCreated={()=>fetchUsers(token)} />}

          {user.role==='admin' && (
            <div style={{marginTop:12,marginBottom:12,display:'flex',gap:8,alignItems:'center'}}>
              <select value={filterUser} onChange={e=>setFilterUser(e.target.value)}>
                <option value=''>Todos usuários</option>
                {users.map(u=>(<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
              <button onClick={()=>fetchRegs(token)}>Filtrar</button>
              <button onClick={exportCSV}>Exportar CSV</button>
            </div>
          )}

          <div style={{marginTop:16}}>
            <h2>Registros</h2>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr><th>ID</th><th>UID</th><th>Timestamp</th><th>Device</th><th>User</th></tr></thead>
              <tbody>
                {rows.map(r=>(
                  <tr key={r.id}><td>{r.id}</td><td>{r.uid}</td><td>{new Date(r.timestamp).toLocaleString()}</td><td>{r.device}</td><td>{r.user?.name||''}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {user.role==='admin' && (
            <div style={{marginTop:24}}>
              <h3>Associar pulseira (UID) a usuário</h3>
              <Associate token={token} users={users} backend={backend} onAssociated={()=>{
                fetchUsers(token); fetchRegs(token);
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
