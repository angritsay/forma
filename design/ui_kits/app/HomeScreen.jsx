const { Icon: PIcon } = window.FormaDesignSystem_383a1d;
const cap = { fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase' };
const disp = { fontFamily: 'var(--font-display)', textTransform: 'uppercase' };
function HomeScreen({ onOpenCourse, onOpenExercise }) {
  const cc = 'var(--course-beginners)';
  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: '0 0 44% 0', overflow: 'hidden' }}>
        <image-slot id="app-home-photo" shape="rect" src="https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=900&q=80&sat=-100" credit="Photo by Edgar Chaparro on Unsplash" credit-href="https://unsplash.com" placeholder="Фото: атлет, монохром"></image-slot>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(15,15,17,.55),transparent 35%,rgba(15,15,17,.94))', pointerEvents: 'none' }} />
      </div>
      <div style={{ position: 'relative', padding: '56px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
        <span style={{fontFamily:'var(--font-display)',textTransform:'uppercase',fontSize:15,color:'#fff',letterSpacing:'.05em',lineHeight:1,display:'inline-flex',alignItems:'baseline',whiteSpace:'nowrap'}}><span style={{fontWeight:800,display:'inline-block',transform:'scaleX(1.22)',transformOrigin:'left center',marginRight:'.16em'}}>F</span><span style={{fontWeight:800}}>OR</span><span style={{fontWeight:200}}>MA</span></span>
        <span style={{ ...cap, color: 'rgba(255,255,255,.7)' }}>Неделя 2 · День 3</span>
      </div>
      <div style={{ position: 'relative', padding: '0 22px', marginTop: 210, pointerEvents: 'none' }}>
        <div style={{ ...disp, fontWeight: 800, fontSize: 40, lineHeight: 1.02, color: '#fff' }}>Присед</div>
        <div style={{ ...disp, fontWeight: 200, fontSize: 40, lineHeight: 1.02, color: '#fff' }}>без боли</div>
        <div style={{ ...cap, color: '#fff', marginTop: 14 }}>Сегодня · 12 минут · без оборудования</div>
      </div>
      <div style={{ position: 'relative', padding: '0 22px', marginTop: 24 }}>
        <button onClick={onOpenExercise} style={{ width: '100%', height: 56, border: 'none', background: 'var(--accent)', color: 'var(--text-on-accent)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer' }}>Начать тренировку</button>
      </div>
      <div style={{ position: 'relative', margin: '22px 22px 0', borderTop: '1px solid var(--border-2)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[['08', 'День из 28'], ['03', 'Упражнения'], ['12′', 'Времени']].map(([n, l]) => (
          <div key={l}><div style={{ ...disp, fontWeight: 600, fontSize: 20, color: '#fff' }}>{n}</div><div style={{ ...cap, color: 'var(--text-3)', marginTop: 4 }}>{l}</div></div>
        ))}
      </div>
      <div style={{ position: 'relative', margin: '20px 22px 0' }}>
        <div style={{ ...cap, color: 'var(--text-3)' }}>Дальше по курсу</div>
        {[['Корпус и планка', 'День 9'], ['Лёгкое кардио', 'День 10']].map(([t, d]) => (
          <div key={t} onClick={onOpenCourse} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-1)', padding: '12px 0', cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: '#fff' }}>{t}</span>
            <span style={{ ...cap, color: 'var(--text-3)' }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
window.HomeScreen = HomeScreen;
