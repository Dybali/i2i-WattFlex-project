import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';
const money = n => new Intl.NumberFormat('tr-TR', {style: 'currency', currency: 'TRY'}).format(n || 0);
const num = (n, d = 1) => Number(n || 0).toFixed(d);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const themeOrder = ['dark', 'light', 'system'];

function App() {
  const [homes, setHomes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('overview');
  const [theme, setTheme] = useState(localStorage.getItem('wattflex-theme') || localStorage.getItem('voltwise-theme') || 'dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    try {
      const response = await fetch(`${API}/homes/status`);
      if (!response.ok) throw new Error((await response.json()).message);
      const data = await response.json();
      setHomes(data);
      if (selected) setSelected(data.find(h => h.id === selected.id) || null);
      setError('');
    } catch (e) {
      setError(e.message || 'Canlı enerji ağına ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    fetch(`${API}/homes/${selected.id}/history?days=7`)
      .then(r => r.ok ? r.json() : [])
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [selected?.id]);

  useEffect(() => {
    const resolved = theme === 'system'
      ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : theme;
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('wattflex-theme', theme);
  }, [theme]);

  const totals = useMemo(() => {
    const energy = homes.reduce((a, h) => a + h.energyKwh, 0);
    const cost = homes.reduce((a, h) => a + h.cost, 0);
    const alerts = homes.filter(h => h.quotaWarning || h.appliances.some(a => a.anomalous)).length;
    const devices = homes.reduce((a, h) => a + h.appliances.length, 0);
    const budget = homes.reduce((a, h) => a + h.budgetLimit, 0);
    return {energy, cost, alerts, devices, budget, carbon: energy * .43};
  }, [homes]);

  const filtered = homes.filter(h => h.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')));
  const alerts = useMemo(() => buildAlerts(homes), [homes]);

  function cycleTheme() {
    setTheme(themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]);
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView('overview')} aria-label="Ana sayfa">
        <span className="brand-mark">ϟ</span>
        <span><b>WATTFLEX</b><small>ENERGY INTELLIGENCE</small></span>
      </button>
      <nav className="nav-tabs" aria-label="Ana menü">
        <NavButton active={view === 'overview'} onClick={() => setView('overview')} label="Genel Bakış"/>
        <NavButton active={view === 'analytics'} onClick={() => setView('analytics')} label="Analiz"/>
        <NavButton active={view === 'goals'} onClick={() => setView('goals')} label="Hedefler"/>
        <NavButton active={view === 'advisor'} onClick={() => setView('advisor')} label="WattFlex AI" spark/>
      </nav>
      <div className="top-actions">
        <button className="icon-button theme-toggle" onClick={cycleTheme} title={`Tema: ${theme}`}>
          {theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◐'}
        </button>
        <button className="icon-button notification-button" onClick={() => setNotificationsOpen(true)} aria-label="Bildirimler">
          ♢{alerts.length > 0 && <i>{alerts.length}</i>}
        </button>
        <button className="primary compact" onClick={() => setShowForm(true)}>＋ Ev ekle</button>
      </div>
    </header>

    <main className="workspace">
      {error && <div className="toast"><span>!</span>{error}</div>}
      {view === 'overview' && <Overview homes={filtered} totals={totals} loading={loading}
        search={search} setSearch={setSearch} onSelect={setSelected} setView={setView}/>} 
      {view === 'analytics' && <Analytics homes={homes} totals={totals}/>} 
      {view === 'goals' && <Goals homes={homes} totals={totals}/>} 
      {view === 'advisor' && <Advisor homes={homes}/>} 
    </main>

    {selected && <Detail home={selected} history={history} onClose={() => setSelected(null)}/>} 
    {showForm && <CreateHome onClose={() => setShowForm(false)} onCreated={() => {setShowForm(false); load();}}/>}
    {notificationsOpen && <NotificationDrawer alerts={alerts} onClose={() => setNotificationsOpen(false)} onOpenHome={home => {setNotificationsOpen(false); setSelected(home);}}/>}
  </div>;
}

function NavButton({active, onClick, label, spark}) {
  return <button className={active ? 'active' : ''} onClick={onClick}>{spark && <span className="ai-spark">✦</span>}{label}</button>;
}

function Overview({homes, totals, loading, search, setSearch, onSelect, setView}) {
  const health = totals.alerts === 0 ? 94 : clamp(94 - totals.alerts * 11, 55, 94);
  const forecast = totals.cost * 1.17;
  return <>
    <section className="hero premium-hero">
      <div className="hero-copy">
        <div className="live-pill"><span/> CANLI ENERJİ AĞI <b>•</b> {totals.devices} CİHAZ BAĞLI</div>
        <h1>Enerjiyi görün.<br/><em>Geleceği yönetin.</em></h1>
        <p>Yapay zekâ destekli tüketim analizi, anlık anomali tespiti ve bütçe zekâsı — tüm enerji ekosisteminiz tek merkezde.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => setView('analytics')}>Analizi keşfet <span>→</span></button>
          <button className="ghost" onClick={() => setView('advisor')}>✦ AI danışmana sor</button>
        </div>
      </div>
      <div className="energy-orbit" style={{'--score': `${health * 3.6}deg`}}>
        <div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/>
        <div className="score-core"><small>ENERJİ SKORU</small><strong>{health}</strong><span>/ 100</span></div>
        <div className="orbit-label label-a"><span>↓ 12%</span> tasarruf</div>
        <div className="orbit-label label-b"><span>{num(totals.carbon)} kg</span> CO₂</div>
      </div>
    </section>

    <section className="metric-grid">
      <Metric icon="ϟ" label="TOPLAM TÜKETİM" value={`${num(totals.energy, 2)} kWh`} trend="−8.4%" good sub="geçen haftaya göre"/>
      <Metric icon="₺" label="GÜNCEL MALİYET" value={money(totals.cost)} trend={`Tahmin ${money(forecast)}`} sub="ay sonu projeksiyonu"/>
      <Metric icon="!" label="AKTİF UYARI" value={totals.alerts} trend={totals.alerts ? 'İnceleme gerekli' : 'Her şey yolunda'} warn={totals.alerts > 0} sub="anomali ve bütçe"/>
      <Metric icon="⌂" label="ENERJİ PORTFÖYÜ" value={`${homes.length} ev`} trend={`${totals.devices} aktif cihaz`} sub="%99.9 veri sürekliliği"/>
    </section>

    <section className="ai-insight-banner">
      <div className="insight-icon">✦</div>
      <div><small>WATTFLEX AI • BUGÜNÜN İÇGÖRÜSÜ</small><p>Klima çalışma saatini 22:00 sonrasına kaydırarak bu ay <b>{money(Math.max(85, totals.cost * .12))}</b> tasarruf edebilirsiniz.</p></div>
      <button onClick={() => setView('advisor')}>Detaylı analiz →</button>
    </section>

    <section className="section-head">
      <div><span className="kicker">PORTFÖY KONTROLÜ</span><h2>Enerji alanlarınız</h2></div>
      <div className="section-tools"><label className="search-box">⌕<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ev ara..."/></label><span className="refresh-status"><i/> 2 sn canlı</span></div>
    </section>

    {loading ? <div className="home-grid">{[1,2,3,4].map(i => <div className="home-card skeleton" key={i}/>)}</div>
      : homes.length ? <div className="home-grid">{homes.map(h => <HomeCard key={h.id} home={h} onClick={() => onSelect(h)}/>)}</div>
      : <div className="empty"><b>⌁</b><h3>Aramanızla eşleşen ev yok</h3><p>Arama ifadesini değiştirin veya yeni bir enerji alanı ekleyin.</p></div>}

    <section className="dashboard-lower">
      <div className="panel wide-panel"><PanelTitle eyebrow="CANLI EĞİLİM" title="Portföy tüketimi" action="Son 7 gün"/><TrendChart energy={totals.energy}/></div>
      <div className="panel impact-panel"><PanelTitle eyebrow="ÇEVRESEL ETKİ" title="Karbon dengesi"/><div className="impact-number"><strong>{num(totals.carbon)}</strong><span>kg CO₂</span></div><div className="tree-visual"><span>♧</span><div><b>{Math.max(1, Math.round(totals.carbon / 8))} ağaç</b><small>eşdeğer dengeleme</small></div></div><div className="mini-progress"><i style={{width: '68%'}}/></div><p>Bu ay hedefinizin <b>%68</b>'ine ulaştınız.</p></div>
    </section>
  </>;
}

function Metric({icon, label, value, trend, sub, good, warn}) {
  return <article className={`metric-card ${warn ? 'metric-warn' : ''}`}><div className="metric-icon">{icon}</div><div className="metric-copy"><small>{label}</small><strong>{value}</strong><span className={good ? 'positive' : ''}>{trend}</span><em>{sub}</em></div></article>;
}

function HomeCard({home, onClick}) {
  const anomaly = home.appliances.some(a => a.anomalous);
  const danger = home.penalty || anomaly;
  const status = home.penalty ? 'CEZA TARİFESİ' : anomaly ? 'ANOMALİ' : home.quotaWarning ? 'BÜTÇE UYARISI' : 'OPTİMAL';
  return <button className={`home-card ${danger ? 'danger' : home.quotaWarning ? 'warning' : ''}`} onClick={onClick}>
    <div className="home-top"><span className="home-symbol">⌂</span><span className="status-dot"><i/>{status}</span></div>
    <h3>{home.name}</h3><p>{home.appliances.length} cihaz • Son veri şimdi</p>
    <div className="budget-row"><span>Bütçe kullanımı</span><b>%{num(home.budgetPercent, 0)}</b></div>
    <div className="budget-track"><i style={{width: `${clamp(home.budgetPercent, 2, 100)}%`}}/></div>
    <div className="home-metrics"><div><small>MALİYET</small><b>{money(home.cost)}</b></div><div><small>ENERJİ</small><b>{num(home.energyKwh)} kWh</b></div><span>→</span></div>
  </button>;
}

function TrendChart({energy}) {
  const data = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((day, i) => ({day, tüketim: +(Math.max(2, energy / 8) * [.74,.92,.81,1.08,.96,1.23,1.05][i]).toFixed(2), hedef: +(Math.max(2, energy / 8) * .93).toFixed(2)}));
  return <div className="trend-chart"><ResponsiveContainer width="100%" height={270}><AreaChart data={data}><defs><linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#43e6a6" stopOpacity=".42"/><stop offset="1" stopColor="#43e6a6" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="var(--grid)" vertical={false}/><XAxis dataKey="day" tickLine={false} axisLine={false} stroke="var(--muted)"/><YAxis tickLine={false} axisLine={false} stroke="var(--muted)"/><Tooltip contentStyle={{background:'var(--panel-solid)',border:'1px solid var(--line)',borderRadius:12}}/><Area type="monotone" dataKey="tüketim" stroke="#43e6a6" strokeWidth={3} fill="url(#energyFill)"/><Area type="monotone" dataKey="hedef" stroke="#6f8f87" strokeDasharray="5 5" fill="none"/></AreaChart></ResponsiveContainer></div>;
}

function Analytics({homes, totals}) {
  const ranking = [...homes].sort((a,b) => b.energyKwh - a.energyKwh);
  const deviceData = homes.flatMap(h => h.appliances).reduce((acc, d) => {const found=acc.find(x=>x.name===d.name); if(found) found.value += d.watts; else acc.push({name:d.name,value:d.watts}); return acc;},[]).sort((a,b)=>b.value-a.value).slice(0,5);
  const monthly = ['Oca','Şub','Mar','Nis','May','Haz','Tem'].map((month,i)=>({month, maliyet: Math.round(Math.max(totals.cost,900)*[.72,.81,.77,.9,.86,1.02,.94][i]), tasarruf: Math.round(90+[26,38,22,54,46,70,82][i])}));
  return <section className="page-section">
    <PageIntro kicker="DERİN ANALİZ" title="Enerji zekâsı, sayılardan fazlası." text="Tüketim davranışlarını karşılaştırın, maliyet sürücülerini keşfedin ve gelecek dönemi öngörün."/>
    <div className="analytics-highlight"><div><small>TAHMİNSEL MALİYET</small><strong>{money(totals.cost * 1.17)}</strong><span className="positive">↓ AI optimizasyonuyla %12 daha düşük</span></div><div className="forecast-bars">{[42,55,48,68,62,75,58,82,73,88,78,92].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div>
    <div className="analytics-grid"><div className="panel chart-panel"><PanelTitle eyebrow="MALİYET MODELİ" title="Aylık performans" action="2026"/><ResponsiveContainer width="100%" height={310}><BarChart data={monthly}><CartesianGrid stroke="var(--grid)" vertical={false}/><XAxis dataKey="month" stroke="var(--muted)" axisLine={false} tickLine={false}/><YAxis stroke="var(--muted)" axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'var(--panel-solid)',border:'1px solid var(--line)',borderRadius:12}}/><Bar dataKey="maliyet" fill="#43e6a6" radius={[6,6,0,0]}/><Bar dataKey="tasarruf" fill="#2b7660" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><div className="panel device-panel"><PanelTitle eyebrow="CİHAZ DAĞILIMI" title="Anlık güç payı"/><div className="pie-wrap"><ResponsiveContainer width="55%" height={220}><PieChart><Pie data={deviceData.length?deviceData:[{name:'Bekleniyor',value:1}]} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={4}>{deviceData.map((_,i)=><Cell key={i} fill={['#43e6a6','#53a8ff','#b693ff','#ffb65a','#ff7468'][i]}/>)}</Pie></PieChart></ResponsiveContainer><div className="pie-center"><strong>{num(deviceData.reduce((a,d)=>a+d.value,0)/1000)}</strong><small>kW canlı</small></div></div><div className="legend-list">{deviceData.map((d,i)=><div key={d.name}><i style={{background:['#43e6a6','#53a8ff','#b693ff','#ffb65a','#ff7468'][i]}}/><span>{d.name}</span><b>{num(d.value,0)} W</b></div>)}</div></div></div>
    <div className="panel ranking-panel"><PanelTitle eyebrow="KARŞILAŞTIRMA" title="Ev performans sıralaması" action={`${homes.length} enerji alanı`}/><div className="ranking-table">{ranking.map((h,i)=><div key={h.id}><span className="rank">{String(i+1).padStart(2,'0')}</span><span className="rank-home"><i>⌂</i><b>{h.name}</b></span><span><small>ENERJİ</small>{num(h.energyKwh)} kWh</span><span><small>MALİYET</small>{money(h.cost)}</span><span><small>VERİMLİLİK</small><b className={h.penalty?'negative':'positive'}>{h.penalty?'Kritik':h.quotaWarning?'Orta':'Yüksek'}</b></span></div>)}</div></div>
  </section>;
}

function Goals({homes, totals}) {
  const goals = [
    {icon:'ϟ',title:'Aylık tüketim',value:Math.min(100, totals.energy/120*100),current:`${num(totals.energy)} / 120 kWh`,color:'green'},
    {icon:'₺',title:'Bütçe koruması',value:totals.budget?Math.min(100, totals.cost/totals.budget*100):0,current:`${money(totals.cost)} / ${money(totals.budget)}`,color:'blue'},
    {icon:'♧',title:'Karbon azaltımı',value:68,current:`${num(totals.carbon)} / 42 kg CO₂`,color:'purple'}
  ];
  return <section className="page-section">
    <PageIntro kicker="HEDEF MERKEZİ" title="Küçük alışkanlıklar. Büyük etki." text="Kişisel hedefler, akıllı görevler ve ölçülebilir başarılarla enerji dönüşümünüzü hızlandırın."/>
    <div className="streak-card"><div className="streak-icon">♨</div><div><small>ENERJİ SERİSİ</small><h2>12 gündür hedefindesin!</h2><p>En uzun serin 18 gün. Bir hafta daha devam edersen “Enerji Ustası” rozetini kazanacaksın.</p></div><div className="week-dots">{['P','S','Ç','P','C','C','P'].map((d,i)=><span className={i<6?'done':''} key={i}><i>{i<6?'✓':''}</i>{d}</span>)}</div></div>
    <div className="goal-grid">{goals.map(g=><article className="goal-card" key={g.title}><div className={`goal-icon ${g.color}`}>{g.icon}</div><small>AKTİF HEDEF</small><h3>{g.title}</h3><div className="goal-ring" style={{'--goal':`${g.value*3.6}deg`}}><strong>%{num(g.value,0)}</strong></div><p>{g.current}</p><button>Hedefi düzenle</button></article>)}</div>
    <div className="challenge-grid"><div className="panel challenge-card"><PanelTitle eyebrow="HAFTANIN GÖREVİ" title="Sessiz tüketim avı"/><p>Bekleme modundaki cihazları gece kapatarak 7 gün içinde 4 kWh tasarruf et.</p><div className="challenge-progress"><span><b>2.8</b> / 4 kWh</span><div><i style={{width:'70%'}}/></div></div><button className="primary">Göreve devam et →</button></div><div className="panel badge-card"><PanelTitle eyebrow="KOLEKSİYON" title="Başarı rozetleri"/><div className="badges"><div className="earned">♧<span>Yeşil Başlangıç</span></div><div className="earned">ϟ<span>Verim Avcısı</span></div><div>◇<span>Enerji Ustası</span></div><div>☆<span>Net Sıfır</span></div></div></div></div>
  </section>;
}

function Advisor({homes}) {
  const [homeId, setHomeId] = useState(homes[0]?.id || '');
  const [question, setQuestion] = useState('Bu ay faturamı nasıl düşürebilirim?');
  const [messages, setMessages] = useState([{role:'ai',text:'Merhaba! Ben WattFlex AI. Enerji profilinizi analiz ederek kişisel, uygulanabilir öneriler sunarım. Hangi konuda yardımcı olayım?'}]);
  const [busy, setBusy] = useState(false);
  useEffect(()=>{if(!homeId&&homes[0])setHomeId(homes[0].id)},[homes]);
  async function ask(text = question) {
    if (!text.trim() || !homeId || busy) return;
    setMessages(m => [...m, {role:'user',text}]); setQuestion(''); setBusy(true);
    try {
      const response = await fetch(`${API}/advisor/${homeId}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text})});
      if(!response.ok) throw new Error('Danışman yanıt veremedi');
      const data = await response.json(); setMessages(m => [...m, {role:'ai',text:data.answer}]);
    } catch(e) {setMessages(m => [...m, {role:'ai',text:'Şu anda canlı modele ulaşamıyorum. Klima sıcaklığını 24°C’ye ayarlamak, bekleme modlarını kapatmak ve yüksek güçlü cihazları gece tarifesinde kullanmak yaklaşık %12 tasarruf sağlayabilir.'}]);}
    finally {setBusy(false);}
  }
  return <section className="page-section advisor-page"><PageIntro kicker="GEMINI DESTEKLİ" title="Enerji danışmanınız artık hep yanınızda." text="Canlı tüketim verilerinizi anlayan, riskleri açıklayan ve size özel aksiyon planı hazırlayan yapay zekâ."/>
    <div className="advisor-layout"><aside className="advisor-context"><div className="ai-orb">✦</div><h3>WattFlex AI</h3><p>Canlı enerji bağlamıyla çalışan kişisel danışman</p><label>Analiz edilecek ev<select value={homeId} onChange={e=>setHomeId(e.target.value)}>{homes.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label><div className="ai-capabilities"><span>✓ Canlı tüketim</span><span>✓ Bütçe tahmini</span><span>✓ Anomali analizi</span><span>✓ Türkçe öneriler</span></div><small className="gemini-note">GEMINI • GÜVENLİ BAĞLANTI</small></aside><div className="chat-panel"><div className="chat-header"><div><span className="online-dot"/><b>WattFlex AI çevrimiçi</b></div><button onClick={()=>setMessages(messages.slice(0,1))}>Konuşmayı temizle</button></div><div className="messages">{messages.map((m,i)=><div className={`message ${m.role}`} key={i}>{m.role==='ai'&&<span className="message-avatar">✦</span>}<p>{m.text}</p></div>)}{busy&&<div className="message ai"><span className="message-avatar">✦</span><p className="typing"><i/><i/><i/></p></div>}</div><div className="quick-prompts">{['En çok tüketen cihaz hangisi?','Ay sonu tahminim nedir?','3 adımlık tasarruf planı'].map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div><form className="chat-input" onSubmit={e=>{e.preventDefault();ask()}}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Enerji verileriniz hakkında bir şey sorun..."/><button disabled={busy||!homeId}>Gönder ↑</button></form></div></div>
  </section>;
}

function Detail({home, history, onClose}) {
  const anomaly = home.appliances.some(a=>a.anomalous);
  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal detail-modal"><button className="close" onClick={onClose}>×</button><div className="modal-title"><span className="home-symbol large">⌂</span><div><small>CANLI ENERJİ PROFİLİ</small><h2>{home.name}</h2><p>{home.email}</p></div></div><div className="detail-metrics"><Metric label="ENERJİ" value={`${num(home.energyKwh,2)} kWh`} icon="ϟ" trend="Canlı toplam"/><Metric label="MALİYET" value={money(home.cost)} icon="₺" trend={`${num(home.budgetPercent,0)}% bütçe`}/><Metric label="CİHAZ DURUMU" value={anomaly?'Anomali':'Optimal'} icon="⌁" trend={`${home.appliances.length} cihaz`} warn={anomaly}/></div>{home.penalty&&<div className="penalty"><b>⚠ Ceza tarifesi etkin</b><span>Bütçe sınırı aşıldı; yeni tüketim premium tarife üzerinden hesaplanıyor.</span></div>}<div className="detail-columns"><div><div className="subhead"><h3>Cihaz telemetrisi</h3><span>CANLI</span></div><div className="devices">{home.appliances.map(a=><div className={`device ${a.anomalous?'anomaly':''}`} key={a.id}><span className="device-icon">{a.anomalous?'!':'ϟ'}</span><div><b>{a.name}</b><small>Güvenli sınır {num(a.safeWattLimit,0)} W</small></div><div className="device-power"><strong>{num(a.watts,0)} W</strong><small>{a.anomalous?'3× limit ihlali':'Normal'}</small></div></div>)}</div></div><div className="detail-chart"><div className="subhead"><h3>7 günlük eğilim</h3><span>kWh</span></div><ResponsiveContainer width="100%" height={280}><AreaChart data={history}><defs><linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#43e6a6" stopOpacity=".4"/><stop offset="1" stopColor="#43e6a6" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="var(--grid)" vertical={false}/><XAxis dataKey="day" stroke="var(--muted)"/><YAxis stroke="var(--muted)"/><Tooltip contentStyle={{background:'var(--panel-solid)',border:'1px solid var(--line)'}}/><Area type="monotone" dataKey="energyKwh" stroke="#43e6a6" strokeWidth={3} fill="url(#detailFill)"/></AreaChart></ResponsiveContainer></div></div></section></div>;
}

function CreateHome({onClose, onCreated}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e){e.preventDefault();setBusy(true);const f=new FormData(e.currentTarget);const body={name:f.get('name'),email:f.get('email'),budgetLimit:+f.get('budget'),baseTariff:+f.get('tariff'),penaltyMultiplier:+f.get('penalty'),appliances:[{name:f.get('device'),safeWattLimit:+f.get('limit')}]};try{const r=await fetch(`${API}/homes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error((await r.json()).message);onCreated();}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <div className="overlay"><form className="modal form" onSubmit={submit}><button type="button" className="close" onClick={onClose}>×</button><span className="kicker">YENİ ENERJİ ALANI</span><h2>Ev profilini oluştur</h2><p className="form-intro">WattFlex birkaç saniye içinde tüketim simülasyonunu başlatacak.</p>{error&&<div className="toast">{error}</div>}<label>Ev adı<input name="name" required placeholder="Kadıköy Evi"/></label><label>Bildirim e-postası<input name="email" type="email" required placeholder="siz@ornek.com"/></label><div className="row"><label>Aylık bütçe (₺)<input name="budget" type="number" min="1" defaultValue="1500"/></label><label>Tarife (₺/kWh)<input name="tariff" type="number" step=".01" min="0" defaultValue="2.6"/></label></div><label>Ceza tarifesi çarpanı<input name="penalty" type="number" step=".1" min="1" defaultValue="1.5"/></label><div className="row"><label>İlk cihaz<input name="device" required placeholder="Klima"/></label><label>Güvenli güç sınırı (W)<input name="limit" type="number" min="1" defaultValue="1800"/></label></div><button className="primary wide" disabled={busy}>{busy?'Profil hazırlanıyor…':'Enerji alanını başlat →'}</button></form></div>;
}

function NotificationDrawer({alerts,onClose,onOpenHome}) {return <div className="drawer-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><aside className="drawer"><div className="drawer-head"><div><span className="kicker">CANLI MERKEZ</span><h2>Bildirimler</h2></div><button onClick={onClose}>×</button></div>{alerts.length?<div className="alert-list">{alerts.map((a,i)=><button key={i} onClick={()=>onOpenHome(a.home)}><span className={a.level}>!</span><div><b>{a.title}</b><p>{a.text}</p><small>Şimdi • {a.home.name}</small></div></button>)}</div>:<div className="empty compact-empty"><b>✓</b><h3>Her şey yolunda</h3><p>Aktif enerji uyarısı bulunmuyor.</p></div>}<div className="drawer-footer">Bildirimler 2 saniyede bir güncellenir.</div></aside></div>}

function buildAlerts(homes){return homes.flatMap(home=>{const list=[];if(home.penalty)list.push({home,level:'critical',title:'Ceza tarifesi etkin',text:`Bütçe %${num(home.budgetPercent,0)} seviyesinde.`});else if(home.quotaWarning)list.push({home,level:'warning',title:'Bütçe sınırına yaklaşıldı',text:`Aylık bütçenin %${num(home.budgetPercent,0)} kadarı kullanıldı.`});home.appliances.filter(a=>a.anomalous).forEach(a=>list.push({home,level:'critical',title:'Cihaz anomalisi',text:`${a.name} güvenli güç sınırını aşıyor.`}));return list;});}
function PanelTitle({eyebrow,title,action}){return <div className="panel-title"><div><small>{eyebrow}</small><h3>{title}</h3></div>{action&&<span>{action}</span>}</div>}
function PageIntro({kicker,title,text}){return <div className="page-intro"><span className="kicker">{kicker}</span><h1>{title}</h1><p>{text}</p></div>}

createRoot(document.getElementById('root')).render(<App/>);
