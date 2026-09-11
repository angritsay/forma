const cap3 = { fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase' };
const disp3 = { fontFamily: 'var(--font-display)', textTransform: 'uppercase' };
function ExerciseScreen({ onBack }) {
  const cc = 'var(--course-beginners)';
  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: '0 0 40% 0', overflow: 'hidden' }}>
        <image-slot id="app-ex-photo" shape="rect" src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80&sat=-100" credit="Photo by Jonathan Borba on Unsplash" credit-href="https://unsplash.com" placeholder="Кадр видео Сергея"></image-slot>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(15,15,17,.5),transparent 40%,rgba(15,15,17,.9))', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', width: 64, height: 64, border: '1px solid rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, pointerEvents: 'none' }}>▶</div>
      </div>
      <div style={{ position: 'relative', padding: '56px 22px 0', display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <span onClick={onBack} style={{ ...cap3, color: '#fff', cursor: 'pointer', pointerEvents: 'auto' }}>← День 8</span>
        <span style={{ ...cap3, color: 'rgba(255,255,255,.7)' }}>2 / 3</span>
      </div>
      <div style={{ position: 'relative', padding: '0 22px', marginTop: 268, pointerEvents: 'none' }}>
        <div style={{ ...cap3, color: cc }}>Объяснили → сделали → отдохнули</div>
        <div style={{ ...disp3, fontSize: 36, lineHeight: 1.04, color: '#fff', marginTop: 10 }}><span style={{ fontWeight: 800 }}>Присед</span> <span style={{ fontWeight: 200 }}>в глубину</span></div>
      </div>
      <div style={{ position: 'relative', flex: 1, padding: '18px 22px 22px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>Колени идут за носками, спина ровная. Смотри, как это делает Сергей, — и повторяй в своём темпе. Боль — сигнал остановиться, а не терпеть.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {['3 подхода', '10 повторов', 'Отдых 60″'].map(t => (
            <span key={t} style={{ ...cap3, border: '1px solid var(--border-2)', color: '#fff', padding: '9px 14px' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
          <button onClick={onBack} style={{ height: 54, border: '1px solid var(--border-2)', background: 'transparent', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer' }}>Позже</button>
          <button onClick={onBack} style={{ height: 54, border: 'none', background: 'var(--accent)', color: 'var(--text-on-accent)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer' }}>Сделано →</button>
        </div>
      </div>
    </div>
  );
}
window.ExerciseScreen = ExerciseScreen;
