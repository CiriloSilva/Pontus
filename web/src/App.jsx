import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const BACKEND =
  window.__BACKEND__               // se quiser injetar manualmente no index.html algum dia
  || import.meta.env.VITE_API_BASE_URL  // Vite (dev/prod)
  || 'http://127.0.0.1:3000';      // fallback pra dev local


// ---------- Header ----------
function Header({ user, route, onNav, onLogout }) {
  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.brand} onClick={() => onNav('home')}>
        <div style={headerStyles.brandTitle}>Pontus</div>
        <div style={headerStyles.brandSub}>Gestão de Pontos</div>
      </div>

      <nav style={headerStyles.nav}>
        <button
          onClick={() => onNav('home')}
          style={{ ...headerStyles.navBtn, ...(route === 'home' ? headerStyles.navBtnActive : {}) }}
        >
          Home
        </button>
        <button
          onClick={() => onNav('registros')}
          style={{ ...headerStyles.navBtn, ...(route === 'registros' ? headerStyles.navBtnActive : {}) }}
        >
          Registros
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => onNav('cadastros')}
            style={{ ...headerStyles.navBtn, ...(route === 'cadastros' ? headerStyles.navBtnActive : {}) }}
          >
            Cadastros
          </button>
        )}
      </nav>

      <div style={headerStyles.rightHeader}>
        {user ? <span style={{ marginRight: 12 }}>{user.name} ({user.role})</span> : null}
        <button onClick={onLogout} style={headerStyles.logoutBtn}>Logout</button>
      </div>
    </header>
  );
}

// ---------- Login ----------
function Login({ onLogin }) {
  const [email,setEmail] = useState('admin@pontus.local');
  const [password,setPassword] = useState('pontusadmin123');
  const [loading,setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      const res = await axios.post(BACKEND + '/api/auth/login',{ email, password });
      onLogin(res.data);
    } catch(e){
      alert('Erro ao logar: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'78vh', background:'#f7f8fb', padding:16
    }}>
      <div style={{
        width: '100%', maxWidth:560, background:'#fff', padding:28,
        borderRadius:12, boxShadow:'0 8px 30px rgba(15,20,30,0.06)', textAlign:'left'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <div>
            <h1 style={{margin:0, fontSize:26}}>Pontus</h1>
            <div style={{color:'#666', marginTop:6}}>Sistema de gestão de pontos comunitários</div>
          </div>
          <div style={{textAlign:'right', color:'#999', fontSize:12}}>v1.4</div>
        </div>

        <hr style={{border:'none', height:1, background:'#eee', margin:'12px 0 18px'}}/>

        <h3 style={{marginTop:0}}>Acessar sistema</h3>
        <p style={{color:'#666', marginTop:0, marginBottom:12}}>Insira suas credenciais para acessar o painel.</p>

        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <input
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="Email"
            style={{padding:10, borderRadius:8, border:'1px solid #e6e9ef'}}
          />
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="Senha"
            style={{padding:10, borderRadius:8, border:'1px solid #e6e9ef'}}
          />
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}>
            <small style={{color:'#777'}}>Use o usuário admin padrão para testes</small>
            <button onClick={submit} style={{ padding:'8px 14px', background:'#111', color:'#fff', border:'none', borderRadius:8 }} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </div>

        <div style={{marginTop:14, color:'#999', fontSize:13}}>
          Dica: admin@pontus.local / pontusadmin123
        </div>
      </div>
    </div>
  );
}

// ---------- Create User ----------
function CreateUser({ token, onCreated }) {
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [role,setRole]=useState('user');
  async function submit(){
    if(!name||!email||!password) return alert('Preencha todos os campos');
    try {
      await axios.post(BACKEND + '/api/users', { name, email, password, role }, { headers:{ Authorization:'Bearer '+token }});
      alert('Usuário criado');
      setName(''); setEmail(''); setPassword(''); setRole('user');
      onCreated && onCreated();
    } catch(e) {
      alert('Erro: ' + (e.response?.data?.error || e.message));
    }
  }
  return (
    <div style={{ padding:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
      <div style={{ minWidth:220 }}>
        <div style={{ fontWeight:700, marginBottom:6 }}>Cadastro de Novo Usuário</div>
        <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} style={{ width:'100%', marginBottom:6 }} />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%', marginBottom:6 }} />
        <input placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%', marginBottom:6 }} />
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
          <button onClick={submit}>Criar</button>
        </div>
      </div>
    </div>
  );
}

// ---------- SearchableUserSelect (autocomplete) ----------
function SearchableUserSelect({ users, value, onChange, placeholder='Procure usuário...' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(()=> {
    const u = users.find(x=>String(x.id)===String(value));
    setQ(u ? u.name : '');
  }, [value, users]);
  useEffect(()=> {
    function onDoc(e){ if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('click', onDoc);
    return ()=> document.removeEventListener('click', onDoc);
  }, []);
  const filtered = q ? users.filter(u => u.name.toLowerCase().includes(q.toLowerCase())) : users.slice(0,50);
  return (
    <div ref={ref} style={{ position:'relative', minWidth:220 }}>
      <input placeholder={placeholder} value={q} onChange={e=>{ setQ(e.target.value); setOpen(true); onChange(''); }} onFocus={()=>setOpen(true)} />
      {open && (
        <div style={styles.dropdown}>
          {filtered.length===0 ? <div style={styles.dropItem}>Nenhum usuário</div> :
            filtered.map(u => (
              <div key={u.id} style={styles.dropItem} onClick={()=>{ onChange(u.id); setQ(u.name); setOpen(false); }}>
                <div style={{fontWeight:600}}>{u.name}</div>
                <div style={{fontSize:12,color:'#666'}}>{u.email}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ---------- AssociateCard ----------
function AssociateCard({ token, users, onDone }) {
  const [uid, setUid] = useState('');
  const [userId, setUserId] = useState('');
  async function associate(){
    if(!uid||!userId) return alert('UID e usuário necessários');
    try {
      await axios.post(BACKEND + '/api/users/' + userId + '/associate-uid', { uid }, { headers:{ Authorization:'Bearer '+token }});
      alert('Associado');
      onDone && onDone();
    } catch(e) { alert('Erro: '+(e.response?.data?.error||e.message)); }
  }
  async function unassociate(){
    if(!uid) return alert('Digite UID para desassociar');
    if(!confirm('Desassociar UID '+uid+' ?')) return;
    try {
      await axios.delete(BACKEND + '/api/cards/' + encodeURIComponent(uid), { headers:{ Authorization:'Bearer '+token }});
      alert('Desassociado');
      onDone && onDone();
    } catch(e) { alert('Erro: '+(e.response?.data?.error||e.message)); }
  }
  return (
    <div style={{ padding:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
      <div style={{ minWidth:240 }}>
        <div style={{ fontWeight:700, marginBottom:6 }}>Associar / Desassociar pulseira</div>
        <input placeholder="UID (ex: 04AABBCC)" value={uid} onChange={e=>setUid(e.target.value)} style={{ width:'100%', marginBottom:6 }} />
        <div style={{ display:'flex', gap:8 }}>
          <SearchableUserSelect users={users} value={userId} onChange={setUserId} placeholder="Escolha usuário (digite para buscar)"/>
          <button onClick={associate}>Associar</button>
          <button onClick={unassociate} style={{ background:'#c53030', color:'#fff' }}>Desassociar</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Registros page (with pagination, pageSize, scrolling table) ----------
function RegistrosPage({ token, user, users, filterUserId, setFilterUserId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  // sorting state: { key: 'id'|'timestamp'|'user', dir: 'asc'|'desc'|null }
  const [sort, setSort] = useState({ key: null, dir: null });

  // date filter state (ISO date strings 'YYYY-MM-DD')
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDatePanel, setShowDatePanel] = useState(false);

  useEffect(()=> {
    fetchRegs();
    startPolling();
    return () => stopPolling();
    // eslint-disable-next-line
  }, [filterUserId, token, page, pageSize]);

  async function fetchRegs(){
    if(!token) return;
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if(filterUserId) params.userId = filterUserId;
      const res = await axios.get(BACKEND + '/api/registros', { headers:{ Authorization:'Bearer '+token }, params });
      const dataRows = res.data.rows || [];
      setRows(dataRows);
      setHasMore(dataRows.length === pageSize);
    } catch (e) {
      console.error('fetchRegs', e);
      if (e.response?.status === 401) alert('Sessão expirada');
    } finally { setLoading(false); }
  }

  function startPolling(){ stopPolling(); pollRef.current = setInterval(fetchRegs, 3000); }
  function stopPolling(){ if(pollRef.current){ clearInterval(pollRef.current); pollRef.current = null; } }

  function toggleSort(key) {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: null };
    });
  }

  // apply client-side date filter + sorting to the currently loaded rows
  const processedRows = React.useMemo(() => {
    let list = [...rows];

    // date filtering (if set)
    if (dateFrom) {
      const fromTs = new Date(dateFrom + 'T00:00:00').getTime();
      list = list.filter(r => new Date(r.timestamp).getTime() >= fromTs);
    }
    if (dateTo) {
      // include full day
      const toTs = new Date(dateTo + 'T23:59:59').getTime();
      list = list.filter(r => new Date(r.timestamp).getTime() <= toTs);
    }

    // sorting
    if (sort && sort.key) {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'id') {
        list.sort((a,b) => (Number(a.id) - Number(b.id)) * dir);
      } else if (sort.key === 'timestamp') {
        list.sort((a,b) => (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * dir);
      } else if (sort.key === 'user') {
        list.sort((a,b) => {
          const an = (a.user?.name || '').toLowerCase();
          const bn = (b.user?.name || '').toLowerCase();
          return an === bn ? 0 : (an > bn ? dir : -dir);
        });
      }
    }

    return list;
  }, [rows, sort, dateFrom, dateTo]);

  // pagination helpers (client-side pagination is still page-based; processedRows currently is page data)
  function goPrev(){ if (page > 1) setPage(p=>p-1); }
  function goNext(){ if (hasMore) setPage(p=>p+1); }

  async function exportCSV(){
    try {
      const res = await axios.get(BACKEND + '/api/registros/export.csv', {
        headers:{ Authorization:'Bearer '+token },
        params: filterUserId ? { userId: filterUserId } : {},
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type:'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'registros.csv'; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar CSV: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={{margin:0}}>Registros</h2>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {user.role === 'admin' && (
            <SearchableUserSelect users={users} value={filterUserId} onChange={(v)=>{ setFilterUserId(v); setPage(1); }} placeholder="Filtrar por usuário (digite)"/>
          )}

          <div style={{ position:'relative' }}>
            <button onClick={() => setShowDatePanel(s=>!s)} style={{ padding:'8px 10px', borderRadius:8 }}>
              📅 Período
            </button>

            {showDatePanel && (
              <div style={{ position:'absolute', right:0, top:42, background:'#fff', padding:12, border:'1px solid #eee', boxShadow:'0 8px 24px rgba(10,10,20,0.06)', zIndex:60 }}>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <div>
                    <label style={{fontSize:12,color:'#666'}}>De</label>
                    <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <label style={{fontSize:12,color:'#666'}}>Até</label>
                    <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
                  </div>
                </div>
                <div style={{display:'flex', gap:8, marginTop:8, justifyContent:'flex-end'}}>
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpar</button>
                  <button onClick={() => { setShowDatePanel(false); fetchRegs(); }}>Aplicar</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={()=>{ setPage(1); fetchRegs(); }}>Filtrar</button>
          <button onClick={exportCSV}>Exportar CSV</button>
        </div>
      </div>

      <div style={{ marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ color:'#666' }}>Página {page} • {processedRows.length} registros nesta página</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <label style={{fontSize:13,color:'#666', marginRight:6}}>Registros por página:</label>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div style={{ maxHeight: 460, overflowY: 'auto', border: '1px solid #eee', borderRadius:8 }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ width:80, cursor:'pointer' }} onClick={()=>toggleSort('id')}>
                  ID {sort.key==='id' ? (sort.dir==='asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ cursor:'pointer' }} onClick={()=>toggleSort('uid')}>UID</th>
                <th style={{ cursor:'pointer' }} onClick={()=>toggleSort('timestamp')}>
                  Data/Hora {sort.key==='timestamp' ? (sort.dir==='asc' ? '↑' : '↓') : ''}
                </th>
                <th>Device</th>
                <th style={{ cursor:'pointer' }} onClick={()=>toggleSort('user')}>
                  Usuário {sort.key==='user' ? (sort.dir==='asc' ? '↑' : '↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {processedRows.map(r => (
                <tr key={r.id}>
                  <td style={{ width:60 }}>{r.id}</td>
                  <td>{r.uid}</td>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>{r.device}</td>
                  <td>{r.user?.name || ''}</td>
                </tr>
              ))}
              {processedRows.length === 0 && (
                <tr><td colSpan={5} style={{ padding:16, textAlign:'center', color:'#777' }}>Nenhum registro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          <div>
            <button onClick={goPrev} disabled={page===1}>Anterior</button>
            <button onClick={goNext} disabled={!hasMore} style={{ marginLeft:8 }}>Próximo</button>
          </div>
          <div style={{ color:'#666' }}>{loading ? 'Carregando...' : ''}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Home ----------
function HomePage() {
  return (
    <div style={{ padding:16, maxWidth:900 }}>
      <h2>Bem-vindo ao Pontus</h2>
      <p>Esse sistema registra presenças com NFC/RFID e permite que administradores gerenciem usuários, associem pulseiras e exportem relatórios.</p>
      <ul>
        <li>Leitura por WebNFC (HTTPS) e encaminhamento ao backend.</li>
        <li>Painel administrativo para associar UID ↔ usuário.</li>
        <li>Relatórios exportáveis em CSV e paginação.</li>
      </ul>
    </div>
  );
}

// ---------- Main App ----------
export default function App(){
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [users, setUsers] = useState([]);
  const [route, setRoute] = useState('home');
  const [filterUserId, setFilterUserId] = useState('');

  useEffect(()=> {
    const t = localStorage.getItem('pontus_token');
    const u = localStorage.getItem('pontus_user');
    if(t && u){
      setToken(t);
      setUser(JSON.parse(u));
      fetchUsers(t);
    }
  }, []);

  async function fetchUsers(t){
    try {
      const res = await axios.get(BACKEND + '/api/users', { headers:{ Authorization:'Bearer '+t }});
      setUsers(res.data || []);
    } catch(e) {
      console.error('fetchUsers', e);
    }
  }

  async function onLogin(data){
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('pontus_token', data.token);
    localStorage.setItem('pontus_user', JSON.stringify(data.user));
    setRoute('home'); // go to home after login
    fetchUsers(data.token);
  }

  function doLogout(){
    localStorage.removeItem('pontus_token'); localStorage.removeItem('pontus_user');
    setToken(''); setUser(null); setRoute('home');
  }

  if(!token || !user) return <Login onLogin={onLogin} />;

  return (
    <div style={{ fontFamily:'Inter,system-ui,Arial', maxWidth:1100, margin:'12px auto', padding:12 }}>
      <Header user={user} route={route} onNav={setRoute} onLogout={doLogout} />
      <main style={{ marginTop:12 }}>
        {route === 'home' && <HomePage />}
        {route === 'registros' && <RegistrosPage token={token} user={user} users={users} filterUserId={filterUserId} setFilterUserId={setFilterUserId} />}
        {route === 'cadastros' && user.role === 'admin' && (
          <div>
            <h2>Cadastros</h2>
            <CreateUser token={token} onCreated={()=>fetchUsers(token)} />
            <hr style={{ margin:'16px 0' }} />
            <AssociateCard token={token} users={users} onDone={()=>fetchUsers(token)} />
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- Styles ---------- */
const headerStyles = {
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #eee', gap:12, background:'#fff' },
  brand: { display:'flex', flexDirection:'column', cursor:'pointer' },
  brandTitle: { fontSize:22, fontWeight:800 },
  brandSub: { fontSize:12, color:'#666' },
  nav: { display:'flex', gap:8 },
  navBtn: { padding:'8px 12px', borderRadius:8, border:'1px solid transparent', background:'#f5f5f5', cursor:'pointer', color:'#222' },
  navBtnActive: { background:'#111', color:'#fff' },
  rightHeader: { display:'flex', alignItems:'center', gap:8 },
  logoutBtn: { padding:'6px 10px', background:'#e53e3e', color:'#fff', border:'none', borderRadius:6, cursor:'pointer' }
};

const styles = {
  dropdown: { position:'absolute', top:38, left:0, right:0, background:'#fff', border:'1px solid #eee', boxShadow:'0 6px 18px rgba(0,0,0,0.06)', zIndex:40, maxHeight:220, overflow:'auto' },
  dropItem: { padding:8, cursor:'pointer', borderBottom:'1px solid #fafafa' },
  pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  table: { width:'100%', borderCollapse:'collapse', margin:0 },
};
