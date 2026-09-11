const cap4 = { fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase' };
const disp4 = { fontFamily: 'var(--font-display)', textTransform: 'uppercase' };
function ProfileScreen() {
  return (
    <div style={{ flex: 1, background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '56px 22px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{fontFamily:'var(--font-display)',textTransform:'uppercase',fontSize:15,color:'var(--ink)',letterSpacing:'.05em',lineHeight:1,display:'inline-flex',alignItems:'baseline',whiteSpace:'nowrap'}}><span style={{fontWeight:800,display:'inline-block',transform:'scaleX(1.22)',transformOrigin:'left center',marginRight:'.16em'}}>F</span><span style={{fontWeight:800}}>OR</span><span style={{fontWeight:200}}>MA</span></span>
        <span style={{ ...cap4, color: 'rgba(15,15,17,.5)' }}>Профиль</span>
      </div>
      <div style={{ padding: '36px 22px 0' }}>
        <div style={{ ...disp4, fontWeight: 800, fontSize: 36, lineHeight: 1, color: 'var(--ink)' }}>Настя</div>
        <div style={{ ...cap4, color: 'rgba(15,15,17,.55)', marginTop: 10 }}>В форме с июля 2026</div>
      </div>
      <div style={{ margin: '26px 22px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border-ink-2)' }}>
        {[['24', 'Тренировки'], ['06', 'Недель'], ['92%', 'Регулярность']].map(([n, l], i) => (
          <div key={l} style={{ padding: i ? '16px 0 16px 14px' : '16px 0', borderRight: i < 2 ? '1px solid var(--border-ink-1)' : 'none' }}>
            <div style={{ ...disp4, fontWeight: 600, fontSize: 24, color: 'var(--ink)' }}>{n}</div>
            <div style={{ ...cap4, color: 'rgba(15,15,17,.5)', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ margin: '18px 22px 0', background: 'var(--bg-0)', padding: 22 }}>
        <div style={{ ...cap4, color: 'rgba(255,255,255,.6)' }}>Серия</div>
        <div style={{ ...disp4, fontSize: 30, color: '#fff', marginTop: 8 }}><span style={{ fontWeight: 800 }}>12</span> <span style={{ fontWeight: 200 }}>дней</span></div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,.6)', marginTop: 8 }}>Лучшая серия за всё время. Так держать.</div>
      </div>
      <div style={{ margin: '10px 22px 0' }}>
        {['Напоминания', 'Моё оборудование', 'Написать Сергею'].map(t => (
          <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid var(--border-ink-1)', cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t}</span>
            <span style={{ color: 'rgba(15,15,17,.4)' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
window.ProfileScreen = ProfileScreen;
