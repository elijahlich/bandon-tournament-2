// src/styles.js
// Masters-inspired palette.
// Augusta National's leaderboard uses cream backgrounds, deep green text and
// trim, black numbers for over-par, red numbers for under-par. We borrow
// that, plus a touch of Masters gold for accents and highlights.

export const palette = {
  green:        '#006747',  // Masters green (PMS 343)
  greenDark:    '#003D27',
  greenMid:     '#14593F',
  greenLight:   '#4F7560',
  greenSubtle:  '#DCE7DD',
  greenPaper:   '#F0EDE0',
  yellow:       '#FFB81C',  // Masters gold
  yellowDark:   '#B57F03',
  yellowSubtle: '#FBEAB8',
  yellowPaper:  '#FFF6DA',
  cream:        '#FAF6E6',  // background
  paper:        '#FFFCEF',  // card surface (slightly brighter)
  paperAlt:     '#F3EDD3',  // alt row / pressed
  red:          '#A11128',  // under-par red
  redDeep:      '#7D0D1F',
  redSubtle:    '#EFD0D2',
  black:        '#1A1A1A',
  ink:          '#26261D',  // primary text
  inkSoft:      '#544F38',  // secondary text
  ash:          '#8B8771',
  ashLight:     '#B8B49A',
  border:       '#DAD3AE',
  borderSoft:   '#EAE2B8',
  shadow:       'rgba(0, 0, 0, 0.08)',
};

const C = palette;

export const styles = {
  // ---- shell ----
  appShell: {
    minHeight: '100vh',
    background: C.cream,
    fontFamily: "Manrope, system-ui, -apple-system, sans-serif",
    color: C.ink,
    paddingBottom: 80,
    backgroundImage:
      `radial-gradient(circle at 0% 0%, rgba(0,103,71,0.04) 0%, transparent 35%),` +
      `radial-gradient(circle at 100% 100%, rgba(255,184,28,0.04) 0%, transparent 35%)`,
  },
  scrollBody: { padding: '14px 14px 24px' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // ---- header ----
  header: {
    background: C.green,
    color: C.cream,
    padding: '14px 16px 12px',
    borderBottom: `3px solid ${C.yellow}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Fraunces, serif',
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: '-0.02em',
    color: C.cream,
    lineHeight: 1,
  },
  headerSubtitle: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: 10,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: C.yellow,
    fontWeight: 700,
    marginTop: 4,
  },
  mePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'rgba(255,255,255,0.16)',
    border: `1px solid rgba(255,255,255,0.25)`,
    borderRadius: 12,
    padding: '4px 10px',
    fontSize: 11,
    color: C.cream,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
    fontFamily: 'Manrope, sans-serif',
  },
  refreshBtn: {
    background: 'rgba(255,255,255,0.16)',
    border: `1px solid rgba(255,255,255,0.25)`,
    borderRadius: 6,
    padding: '5px 8px',
    cursor: 'pointer',
    color: C.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- bottom nav ----
  bottomNav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(250, 246, 230, 0.97)',
    borderTop: `1px solid ${C.border}`,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    padding: '10px 0 14px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 10,
  },
  navBtn: {
    background: 'transparent', border: 'none',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    cursor: 'pointer', padding: '4px 14px',
    fontFamily: 'Manrope, sans-serif',
  },

  // ---- cards / tables ----
  card: {
    background: C.paper,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    boxShadow: `0 1px 0 ${C.shadow}`,
    overflow: 'hidden',
  },
  cardHeader: {
    background: C.greenPaper,
    padding: '10px 14px',
    borderBottom: `1px solid ${C.border}`,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'Manrope, sans-serif' },
  th: {
    padding: '10px 6px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: C.green,
    textAlign: 'center',
    borderBottom: `1px solid ${C.border}`,
    background: C.greenPaper,
  },
  tr:    { background: C.paper },
  trAlt: { background: C.paperAlt },
  td:    { padding: '10px 6px', fontSize: 12, textAlign: 'center', borderBottom: `1px solid ${C.borderSoft}` },
  tdMono: { fontFamily: "'JetBrains Mono', ui-monospace, monospace" },

  // ---- buttons ----
  iconBtn: {
    background: C.greenPaper, border: `1px solid ${C.border}`,
    borderRadius: 8, width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  iconDangerBtn: {
    background: 'transparent', border: `1px solid ${C.redSubtle}`,
    borderRadius: 6, width: 32, height: 32,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: C.red,
  },
  primaryBtn: {
    background: C.green, color: C.cream, border: 'none',
    borderRadius: 6, padding: '10px 14px',
    fontFamily: 'Manrope, sans-serif', fontWeight: 700,
    fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em',
  },
  secondaryBtn: {
    background: C.greenPaper, color: C.green, border: `1px solid ${C.border}`,
    borderRadius: 6, padding: '10px 14px',
    fontFamily: 'Manrope, sans-serif', fontWeight: 600,
    fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em',
  },
  smallBtn: {
    background: C.greenPaper, color: C.green, border: `1px solid ${C.border}`,
    borderRadius: 4, padding: '6px 10px',
    fontFamily: 'Manrope, sans-serif', fontWeight: 600,
    fontSize: 11, cursor: 'pointer',
  },
  dangerBtn: {
    width: '100%', background: C.paper, color: C.red,
    border: `1px solid ${C.redSubtle}`,
    borderRadius: 6, padding: '12px 14px',
    fontFamily: 'Manrope, sans-serif', fontWeight: 700,
    fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em',
  },
  bigCTA: {
    width: '100%', background: C.green, color: C.cream, border: 'none',
    borderRadius: 8, padding: '18px 14px',
    fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18,
    cursor: 'pointer', letterSpacing: '0.02em',
    boxShadow: `0 2px 6px ${C.shadow}`,
  },
  bigCTAYellow: {
    width: '100%', background: C.yellow, color: C.greenDark, border: 'none',
    borderRadius: 8, padding: '18px 14px',
    fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18,
    cursor: 'pointer', letterSpacing: '0.02em',
    boxShadow: `0 2px 6px ${C.shadow}`,
  },

  // ---- inputs ----
  scoreInputBig: {
    width: '100%',
    height: 64,
    padding: 0,
    background: C.paper,
    textAlign: 'center',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 30,
    fontWeight: 700,
    color: C.ink,
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    outline: 'none',
  },
  miniInput: {
    width: 30, height: 26, padding: 0,
    border: `1px solid ${C.border}`, borderRadius: 3,
    textAlign: 'center',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 11, background: C.paper, color: C.ink,
  },
  hcpInput: {
    width: 70, padding: '8px 6px',
    textAlign: 'center',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 16, fontWeight: 700, color: C.ink,
    border: `1px solid ${C.border}`, borderRadius: 6, background: C.paper,
  },
  nameInput: {
    fontFamily: 'Fraunces, serif', fontWeight: 600,
    fontSize: 16, color: C.ink,
    background: 'transparent', border: 'none',
    borderBottom: '1px dashed transparent', padding: '2px 0',
    outline: 'none', width: '80%',
  },
  input: {
    width: '100%', padding: '8px 10px',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: 13,
    border: `1px solid ${C.border}`, borderRadius: 6, background: C.paper, color: C.ink,
  },
  label: {
    fontSize: 10, color: C.green, textTransform: 'uppercase',
    letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4,
  },
  select: {
    padding: '6px 8px',
    fontFamily: 'Manrope, sans-serif', fontSize: 12,
    border: `1px solid ${C.border}`, borderRadius: 6, background: C.paper, color: C.ink,
  },

  // ---- specialty ----
  roundChip: {
    background: C.paper, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '14px 14px',
    textAlign: 'left', cursor: 'pointer',
    fontFamily: 'inherit', color: 'inherit',
    boxShadow: `0 1px 0 ${C.shadow}`, width: '100%',
  },
  championBanner: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    background: `linear-gradient(135deg, ${C.yellowPaper} 0%, ${C.yellowSubtle} 100%)`,
    border: `1px solid ${C.yellowDark}`,
    borderRadius: 8,
    boxShadow: `0 1px 0 ${C.shadow}`,
  },
  meChoice: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', background: C.paper,
    border: `1px solid ${C.border}`, borderRadius: 8,
    cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left',
  },
  modalBackdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0, 61, 39, 0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, zIndex: 100,
    backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
  },
  modal: {
    background: C.paper, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 20, maxWidth: 420, width: '100%',
    maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
  },
  // hole entry — big readable layout
  holeHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '8px 0 18px',
  },
  holeNumberBig: {
    fontFamily: 'Fraunces, serif',
    fontSize: 72,
    fontWeight: 700,
    color: C.green,
    lineHeight: 0.85,
    letterSpacing: '-0.04em',
  },
  parBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 4,
    background: C.greenPaper,
    color: C.green,
    fontFamily: 'Manrope, sans-serif',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  playerScoreRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 100px',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: C.paper,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    marginBottom: 10,
    boxShadow: `0 1px 0 ${C.shadow}`,
  },
};

// Used inline for FontInjector
export const fontCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700;9..144,900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { background: ${C.cream}; }
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  button { font-family: inherit; }
  select { font-family: inherit; }
  ::-webkit-scrollbar { height: 6px; width: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,103,71,0.3); border-radius: 3px; }
`;
