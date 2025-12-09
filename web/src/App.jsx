import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const BACKEND = (window.__BACKEND__ || 'http://127.0.0.1:3000');

// ---------- small UI atoms ----------
function Header({ user, onNav, onLogout }) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>
        <strong style={{fontSize:18}}>Pontus</strong>
        <span style={{marginLeft:8,color:'#666'}}>Gestão de Pontos</span>
      </div>
      <nav style={styles.nav}>
        <button onClick={()=>onNav('home')} style={styles.navBtn}>Home</button>
        <button onClick={()=>onNav('registros')} style={styles.navBtn}>Registros</button>
        <button onClick={()=>onNav('cadastros')} style={styles.navBtn}>Cadastros</button>
      </nav>
      <div style={styles.rightHeader}>
        {user ? <span style={{marginRight:12}}>{user.name} ({user.role})</span> : null}
        <button onClick={onLogout} style={styles.btn}>Logout</button>
      </div>
    </header>
  );
}

// ---------- Login ----------
function Login({ onLogin }) {
  const [email,setEmail] = useState('admin@pontus.local');
  const [password,setPassword] = useState('pontusadmin123');
  async function submit() {
    try {
      const res = await axios.post(BACKEND + '/api/auth/login',{ email, password });
      onLogin(res.data);
    } catch(e){ alert('Erro ao logar: ' + (e.response?.data?.error || e.message)); }
  }
  return (
    <div style={{padding:24,maxWidth:720,margin:'40px auto',textAlign:'center'}}>
      <h2>Entrar</h2>
      <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:12}}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="senha" />
        <button onClick={submit}>Entrar</button>
      </div>
    </div>
  );
}

// ---------- Create User (used in Cadastros) ----------
function CreateUser({ token, onCreated }) {
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('user');
  async function submit(){
    if(!name||!email||!password) return alert('Preencha todos os campos');
    try{
      await axios.post(BACKEND + '/api/users', { name, email, password, role }, { headers:{ Authorization:'Bearer '+token }});
      alert('Usuário criado');
      setName(''); setEmail(''); setPassword(''); setRole('user');
      onCreated && onCreated();
    }catch(e){ alert('Erro: '+(e.response?.data?.error||e.message)); }
  }
  return (
    <div style={{padding:12,display:'flex',gap:8,alignItems:'center'}}>
      <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
      <select value={role} onChange={e=>setRole(e.target.value)}><option value="user">Usuário</option><option value="admin">Administrador</option></select>
      <button onClick={submit}>Criar</button>
    </div>
  );
}

// ---------- SearchableUserSelect (autocomplete) ----------
function SearchableUserSelect({ users, value, onChange, placeholder='Procure usuário...' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(()=>{ // keep q in sync if value is id
    const u = users.find(x=>String(x.id)===String(value));
    setQ(u ? u.name : '');
  }, [value, users]);

  useEffect(()=> {
    function onDoc(e){
      if(ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return ()=> document.removeEventListener('click', onDoc);
  },[]);

  const filtered = q ? users.filter(u => u.name.toLowerCase().includes(q.toLowerCase())) : users.slice(0,50);

  return (
    <div ref={ref} style={{position:'relative',minWidth:220}}>
      <input
        placeholder={placeholder}
        value={q}
        onChange={e=>{ setQ(e.target.value); setOpen(true); onChange(''); }}
        onFocus={()=>setOpen(true)}
      />
      {open && (
        <div style={styles.dropdown}>
          {filtered.length===0 ? <div style={styles.dropItem}>Nenhum usuário</div> :
            filtered.map(u => (
              <div key={u.id} style={styles.dropItem} onClick={()=>{ onChange(u.id); setQ(u.name); setOpen(false); }}>
                {u.name} <small style={{color:'#666',marginLeft:8}}>{u.email}</small>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ---------- Associate card component (for Cadastros) ----------
function AssociateCard({ token, users, onDone }) {
  const [uid, setUid] = useState('');
  const [userId, setUserId] = useState('');
  async function associate(){
    if(!uid||!userId) return alert('UID e usuário necessários');
    try{
      await axios.post(BACKEND + '/api/users/' + userId + '/associate-uid', { uid }, { headers:{ Authorization:'Bearer '+token }});
      alert('Associado');
      onDone && onDone();
    } catch(e){ alert('Erro: '+(e.response?.data?.error||e.message)); }
  }
  async function unassociate(){
    if(!uid) return alert('Digite UID para desassociar');
    if(!confirm('Desassociar UID '+uid+' ?')) return;
    try{
      await axios.delete(BACKEND + '/api/cards/' + encodeURIComponent(uid), { headers:{ Authorization:'Bearer '+token }});
      alert('Desassociado');
      onDone && onDone();
    } catch(e){ alert('Erro: '+(e.response?.data?.error||e.message)); }
  }
  return (
    <div style={{display:'flex',gap:8,alignItems:'center',padding:12}}>
      <input placeholder="UID (ex: 04AABBCC)" value={uid} onChange={e=>setUid(e.target.value)} />
      <SearchableUserSelect users={users} value={userId} onChange={setUserId} placeholder="Escolha usuário (digite para buscar)"/>
      <button onClick={associate}>Associar</button>
      <button onClick={unassociate} style={{background:'#c53030'}}>Desassociar</button>
    </div>
  );
}

// ---------- Registros page ----------
function RegistrosPage({ token, user, users, filterUserId, setFilterUserId }) {
  const [rows, setRows] = useState([]);
  const pollRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    fetchRegs();
    startPolling();
    return ()=> stopPolling();
    // eslint-disable-next-line
  }, [filterUserId, token]);

  async function fetchRegs(){
    if(!token) return;
    setLoading(true);
    try{
      const params = {};
      if(filterUserId) params.userId = filterUserId;
      const res = await axios.get(BACKEND + '/api/registros', { headers:{ Authorization:'Bearer '+token }, params });
      setRows(res.data.rows || []);
    } catch(e){
      console.error(e);
      if(e.response?.status === 401) { alert('Sessão expirada'); }
    } finally { setLoading(false); }
  }
  function startPolling(){
    stopPolling();
    pollRef.current = setInterval(fetchRegs, 3000);
  }
  function stopPolling(){
    if(pollRef.current){ clearInterval(pollRef.current); pollRef.current = null; }
  }
  async function exportCSV(){
    try{
      const res = await axios.get(BACKEND + '/api/registros/export.csv', { headers:{ Authorization:'Bearer '+token }, params: filterUserId ? { userId: filterUserId } : {}, responseType:'blob' });
      const blob = new Blob([res.data], { type:'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'registros.csv'; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch(e){ alert('Erro ao exportar: '+(e.response?.data?.error||e.message)); }
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={{margin:0}}>Registros</h2>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {user.role === 'admin' && (
            <SearchableUserSelect users={users} value={filterUserId} onChange={setFilterUserId} placeholder="Filtrar por usuário (digite)"/>
          )}
          <button onClick={fetchRegs}>Filtrar</button>
          <button onClick={exportCSV}>Exportar CSV</button>
        </div>
      </div>

      <div style={{marginTop:12}}>
        {loading ? <div>Carregando...</div> : (
          <table style={styles.table}>
            <thead><tr><th>ID</th><th>UID</th><th>Data/Hora</th><th>Device</th><th>Usuário</th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}><td>{r.id}</td><td>{r.uid}</td><td>{new Date(r.timestamp).toLocaleString()}</td><td>{r.device}</td><td>{r.user?.name||''}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------- Home page ----------
function HomePage(){ return (
  <div style={{padding:16, maxWidth:900}}>
    <h2>Bem-vindo ao Pontus</h2>
    <p>Esse sistema registra presenças com NFC/RFID e permite que administradores gerenciem usuários, associem pulseiras e exportem relatórios.</p>
    <ul>
      <li>Leitura por WebNFC (HTTPS) e envio para o backend.</li>
      <li>Painel administrativo para associar UID ↔ usuário.</li>
      <li>Relatórios exportáveis em CSV.</li>
    </ul>
  </div>
); }

// ---------- Main App ----------
export default function App(){
  const [user,setUser] = useState(null);
  const [token,setToken] = useState('');
  const [users, setUsers] = useState([]);
  const [route,setRoute] = useState('home'); // home | registros | cadastros
  const [filterUserId, setFilterUserId] = useState('');
  useEffect(()=> {
    const t = localStorage.getItem('pontus_token');
    const u = localStorage.getItem('pontus_user');
    if(t && u){ setToken(t); setUser(JSON.parse(u)); fetchUsers(t); }
  }, []);
  async function onLogin(data){
    setToken(data.token); setUser(data.user); localStorage.setItem('pontus_token', data.token); localStorage.setItem('pontus_user', JSON.stringify(data.user));
    setRoute('registros'); fetchUsers(data.token);
  }
  function doLogout(){ localStorage.removeItem('pontus_token'); localStorage.removeItem('pontus_user'); setToken(''); setUser(null); setRoute('home'); }

  async function fetchUsers(t){
    try{ const res = await axios.get(BACKEND + '/api/users', { headers:{ Authorization:'Bearer '+t } }); setUsers(res.data); }
    catch(e){ console.error('fetchUsers', e); }
  }

  if(!token || !user) return <Login onLogin={onLogin} />;

  return (
    <div style={{fontFamily:'Inter,system-ui,Arial',maxWidth:1100,margin:'12px auto',padding:12}}>
      <Header user={user} onNav={setRoute} onLogout={doLogout} />
      <main style={{marginTop:12}}>
        {route === 'home' && <HomePage /> }
        {route === 'registros' && <RegistrosPage token={token} user={user} users={users} filterUserId={filterUserId} setFilterUserId={setFilterUserId} /> }
        {route === 'cadastros' && (
          <div>
            <h2>Cadastros</h2>
            <CreateUser token={token} onCreated={()=>fetchUsers(token)} />
            <hr />
            <h3 style={{marginTop:12}}>Associar / Desassociar pulseira</h3>
            <AssociateCard token={token} users={users} onDone={()=>{/* refresh if needed */}} />
          </div>
        )}
      </main>
    </div>
  );
}

// ---------- styles ----------
const styles = {
  header: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #eee',gap:12 },
  brand: { display:'flex',alignItems:'baseline',gap:8 },
  nav: { display:'flex',gap:8 },
  navBtn: { padding:'6px 10px', borderRadius:8, border:'none', background:'transparent', cursor:'pointer' },
  rightHeader: { display:'flex',alignItems:'center',gap:8 },
  btn: { padding:'6px 10px', borderRadius:8, border:'none', background:'#111', color:'#fff' },

  dropdown: { position:'absolute', top:38, left:0, right:0, background:'#fff', border:'1px solid #eee', boxShadow:'0 6px 18px rgba(0,0,0,0.06)', zIndex:40, maxHeight:220, overflow:'auto'},
  dropItem: { padding:8, cursor:'pointer', borderBottom:'1px solid #fafafa' },

  pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  table: { width:'100%', borderCollapse:'collapse', marginTop:12 },
};
