const cap2 = { fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase' };
const disp2 = { fontFamily: 'var(--font-display)', textTransform: 'uppercase' };
function CourseScreen({ onBack, onOpenExercise }) {
  const cc = 'var(--course-beginners)';
  const days = [
    ['06', 'Разминка сверху вниз', '10 минут ✓', 'done'],
    ['07', 'Техника приседа', '12 минут ✓', 'done'],
    ['08', 'Присед без боли', 'Сегодня · 12 минут', 'today'],
    ['09', 'Корпус и планка', '14 минут', 'locked'],
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: cc }}>
      <div style={{ padding: '56px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span onClick={onBack} style={{ ...cap2, color: 'var(--ink)', cursor: 'pointer' }}>← Курсы</span>
        <span style={{ ...cap2, color: 'rgba(15,15,17,.55)' }}>4 недели</span>
      </div>
      <div style={{ padding: '34px 22px 0' }}>
        <div style={{ ...disp2, fontWeight: 800, fontSize: 46, lineHeight: 1, color: 'var(--ink)' }}>База</div>
        <div style={{ ...disp2, fontWeight: 200, fontSize: 27, lineHeight: 1.15, color: 'var(--ink)', marginTop: 6 }}>без оборудования</div>
        <div style={{ ...cap2, color: 'rgba(15,15,17,.6)', marginTop: 14 }}>Первый шаг · Сергей Титов</div>
      </div>
      <div style={{ padding: '26px 22px 22px', display: 'flex', gap: 10 }}>
        {[['Нед 1 ✓', 1], ['Нед 2 ●', 1], ['Нед 3', 0], ['Нед 4', 0]].map(([w, on]) => (
          <div key={w} style={{ flex: 1, borderTop: on ? '2px solid var(--ink)' : '2px solid rgba(15,15,17,.25)', paddingTop: 8 }}>
            <span style={{ ...cap2, color: on ? 'var(--ink)' : 'rgba(15,15,17,.45)' }}>{w}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, background: 'var(--bg-0)', padding: '24px 22px' }}>
        <div style={{ ...cap2, color: 'var(--text-3)' }}>Неделя 2 · 5 дней</div>
        <div style={{ marginTop: 10 }}>
          {days.map(([n, t, m, st]) => (
            <div key={n} onClick={st === 'today' ? onOpenExercise : undefined}
              style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 0',
                borderBottom: st === 'today' ? `1px solid ${cc}` : '1px solid var(--border-1)', opacity: st === 'locked' ? .5 : 1, cursor: st === 'today' ? 'pointer' : 'default' }}>
              <span style={{ ...disp2, fontWeight: 600, fontSize: 18, color: st === 'today' ? cc : 'var(--text-3)' }}>{n}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: '#fff' }}>{t}</div>
                <div style={{ ...cap2, color: st === 'today' ? cc : 'var(--text-3)', marginTop: 3 }}>{m}</div>
              </div>
              <span style={{ color: st === 'done' ? cc : st === 'today' ? cc : 'var(--text-3)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{st === 'done' ? '✓' : st === 'today' ? '→' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.CourseScreen = CourseScreen;
