// src/components.jsx
// All UI components for the Bandon tournament app.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy, Users, Settings as SettingsIcon, ChevronLeft, ChevronRight,
  Flag, Edit3, Check, AlertCircle, Cloud, CloudOff, Swords, Target, Star,
  RefreshCw, Plus, Trash2, Download, X, User, Lock,
} from 'lucide-react';

import { styles, palette as C, fontCSS } from './styles.js';
import {
  TEE_OPTIONS, MAX_OVER_PAR,
  effectiveCourse, courseHandicap, strokesOnHole, adjustedCH,
  playerTotalsAdj, lowestHcpPlayer, capScore, safeNum, roundToHalf,
  computeSkinsForRound, computeSkinsOverall,
  computeMatch, computeAntiShtickStandings, projectR5Matchups, isR5Locked, regularPhaseComplete,
  computeHitAHouseQualifier, computeHitAHouseChampionship, qualifierComplete,
  getRoundFoursomes, downloadCSV,
} from './lib.js';

// =====================================================================
// SHARED
// =====================================================================
export function FontInjector() {
  return <style>{fontCSS}</style>;
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function Header({ syncStatus, lastSync, me, players, onChangeMe, onRefresh }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const myPlayer = players.find(p => p.id === me);
  return (
    <div style={styles.header}>
      <div>
        <div style={styles.headerTitle}>
          Bandon <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.yellow }}>Dunes</span>
        </div>
        <div style={styles.headerSubtitle}>Aug 28 – 31</div>
        <button onClick={onChangeMe} style={styles.mePill}>
          <User size={11} />
          <span>{myPlayer ? myPlayer.name : 'Set who you are'}</span>
          <ChevronRight size={11} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <button onClick={onRefresh} style={styles.refreshBtn} title="Refresh">
          <RefreshCw size={13} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Manrope, sans-serif', fontSize: 10, color: C.yellow, fontWeight: 600 }}>
          {syncStatus === 'saving' && <><Cloud size={11} /> Syncing</>}
          {syncStatus === 'saved'  && <><Check size={11} /> Synced</>}
          {syncStatus === 'error'  && <><CloudOff size={11} /> Offline</>}
          {syncStatus === 'idle'   && <span>{timeAgo(lastSync)}</span>}
        </div>
      </div>
    </div>
  );
}

export function BottomNav({ view, setView }) {
  const tabs = [
    { id: 'leaderboard', label: 'Boards',  icon: Trophy },
    { id: 'rounds',      label: 'Scoring', icon: Flag },
    { id: 'players',     label: 'Players', icon: Users },
    { id: 'settings',    label: 'Setup',   icon: SettingsIcon },
  ];
  return (
    <div style={styles.bottomNav}>
      {tabs.map(t => {
        const Icon = t.icon;
        const active = view === t.id || (t.id === 'rounds' && (view === 'foursome' || view === 'entry'));
        return (
          <button key={t.id} onClick={() => setView(t.id)} style={{ ...styles.navBtn, color: active ? C.green : C.ashLight }}>
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <div style={{ fontSize: 10, fontWeight: active ? 700 : 500, marginTop: 3, letterSpacing: '0.04em' }}>{t.label}</div>
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title, subtitle, style }) {
  return (
    <div style={{ marginBottom: 10, ...(style || {}) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        {Icon && <Icon size={14} color={C.green} strokeWidth={2.2} />}
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.green }}>{eyebrow}</div>
      </div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: C.greenDark, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</div>
      {subtitle && <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.inkSoft, marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

function Tag({ label, tone }) {
  const map = {
    green:   { bg: C.greenSubtle, fg: C.green },
    yellow:  { bg: C.yellowPaper, fg: C.yellowDark },
    neutral: { bg: C.paperAlt,    fg: C.inkSoft },
    red:     { bg: C.redSubtle,   fg: C.red },
  };
  const p = map[tone] || map.neutral;
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 3, background: p.bg, color: p.fg }}>{label}</div>
  );
}

// =====================================================================
// FIRST-LAUNCH "WHO ARE YOU"
// =====================================================================
export function MeSetupView({ players, onPick, onSkip }) {
  return (
    <div style={{ ...styles.scrollBody, paddingTop: 60 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Trophy size={36} color={C.yellow} fill={C.yellow} style={{ marginBottom: 16 }} />
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: C.greenDark, letterSpacing: '-0.02em' }}>Which one are you?</div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: C.inkSoft, marginTop: 8, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
          We'll highlight you during score entry. You can still tap others to enter their scores.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map(p => (
          <button key={p.id} onClick={() => onPick(p.id)} style={styles.meChoice}>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 17, color: C.greenDark }}>{p.name}</div>
              <div style={{ fontSize: 10, color: C.inkSoft, fontFamily: "'JetBrains Mono', ui-monospace, monospace", marginTop: 2 }}>HCP {p.hcp.toFixed(1)}</div>
            </div>
            <ChevronRight size={18} color={C.green} />
          </button>
        ))}
      </div>
      <button onClick={onSkip} style={{ ...styles.secondaryBtn, marginTop: 16, width: '100%' }}>Skip for now</button>
    </div>
  );
}

// =====================================================================
// LEADERBOARD
// =====================================================================
export function LeaderboardView({ meta, scores, settings, onOpenRound }) {
  const hahCh = useMemo(() => computeHitAHouseChampionship(meta, scores, settings), [meta, scores, settings]);
  const asStandings = useMemo(() => computeAntiShtickStandings(meta, scores, settings), [meta, scores, settings]);
  const skinsOverall = useMemo(() => computeSkinsOverall(meta, scores, settings), [meta, scores, settings]);
  const projectedR5 = useMemo(() => isR5Locked(meta) ? null : projectR5Matchups(meta, scores, settings), [meta, scores, settings]);

  return (
    <div style={styles.scrollBody}>
      <SectionTitle icon={Trophy} eyebrow="Individual · Net" title="Hit-A-House Championship"
        subtitle="Fri/Sat/Sun mornings qualify · Top 4 play Mon · Strokes off Alex" />
      <HitAHouseBoard hahCh={hahCh} meta={meta} />

      <SectionTitle icon={Swords} eyebrow="Teams · Match Play" title="Anti-Shtick Invitational"
        subtitle="Every hole counts · Winner = most holes won across all 4 rounds"
        style={{ marginTop: 28 }} />
      <AntiShtickBoard meta={meta} scores={scores} settings={settings} standings={asStandings} projectedR5={projectedR5} />

      <SectionTitle icon={Target} eyebrow="Side Game" title="Skins"
        subtitle={settings.skinsCarryover ? 'Strokes off field low · ties CARRY OVER' : 'Strokes off field low · ties = no skin'}
        style={{ marginTop: 28 }} />
      <SkinsBoard meta={meta} scores={scores} settings={settings} overall={skinsOverall} />

      <SectionTitle icon={Flag} eyebrow="Schedule" title="Rounds" style={{ marginTop: 28 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {meta.rounds.map(r => <RoundChip key={r.id} round={r} meta={meta} scores={scores} onClick={() => onOpenRound(r.id)} />)}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

// =====================================================================
// HIT-A-HOUSE BOARD
// =====================================================================
function HitAHouseBoard({ hahCh, meta }) {
  const { qualifier, qualifiedIds, allQualifiersComplete, cRound, course: cCourse, results } = hahCh;
  const champPlayed = results.some(r => r.played > 0);
  const championDecided = champPlayed && results[0]?.played === 18;
  const completedQRounds = qualifier[0]?.totalQ ? Math.min(...qualifier.map(q => q.completedRounds)) : 0;
  const totalQRounds = qualifier[0]?.totalQ || 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {championDecided && (
        <div style={styles.championBanner}>
          <Star size={16} color={C.yellowDark} fill={C.yellow} />
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.yellowDark, fontWeight: 700 }}>Hit-A-House Champion</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: C.greenDark, lineHeight: 1 }}>{results[0].player.name}</div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
              Monday net <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, color: C.greenDark }}>{results[0].net}</span>
            </div>
          </div>
        </div>
      )}

      {cRound && (
        <div style={styles.card}>
          <div style={{ padding: '12px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.green, fontWeight: 700 }}>Championship Round</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 600, color: C.greenDark }}>{cCourse?.name} · Mon Aug 31</div>
            </div>
            <Tag label="HH Final" tone="red" />
          </div>
          {!allQualifiersComplete && (
            <div style={{ padding: '6px 14px', fontSize: 11, color: C.red, background: C.redSubtle, borderTop: `1px solid ${C.border}` }}>
              ⚠ Qualifier incomplete — top 4 provisional ({completedQRounds}/{totalQRounds} rounds complete)
            </div>
          )}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
                <th style={styles.th}>Gross</th>
                <th style={{ ...styles.th, color: C.green }}>Net</th>
                <th style={styles.th}>Thru</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.player.id} style={i % 2 ? styles.trAlt : styles.tr}>
                  <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && r.played > 0 ? C.red : C.inkSoft }}>{r.played > 0 ? i + 1 : '–'}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: C.greenDark, textAlign: 'left' }}>{r.player.name}</td>
                  <td style={{ ...styles.td, ...styles.tdMono }}>{r.played > 0 ? r.gross : '—'}</td>
                  <td style={{ ...styles.td, ...styles.tdMono, fontWeight: 700, color: C.greenDark, background: i === 0 && r.played > 0 ? C.yellowSubtle : 'transparent' }}>{r.played > 0 ? r.net : '—'}</td>
                  <td style={{ ...styles.td, ...styles.tdMono, color: C.inkSoft, fontSize: 11 }}>{r.played}/18</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={5} style={{ ...styles.td, color: C.ashLight, padding: 16 }}>Top 4 qualifiers haven't been determined yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ padding: '12px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.green, fontWeight: 700 }}>Qualifier {allQualifiersComplete ? 'Final' : 'Standings'}</div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Top 4 advance · Tiebreak: best single round → lowest gross</div>
          </div>
          {!allQualifiersComplete && (<div style={{ fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: '0.1em' }}>PROVISIONAL</div>)}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
                <th style={styles.th}>Fri</th>
                <th style={styles.th}>Sat</th>
                <th style={styles.th}>Sun</th>
                <th style={{ ...styles.th, color: C.green }}>Net</th>
                <th style={styles.th}>Q</th>
              </tr>
            </thead>
            <tbody>
              {qualifier.map((row, i) => {
                const qualified = qualifiedIds.includes(row.player.id) && row.anyPlayed;
                return (
                  <tr key={row.player.id} style={i % 2 ? styles.trAlt : styles.tr}>
                    <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && row.anyPlayed ? C.red : C.inkSoft }}>{row.anyPlayed ? i + 1 : '–'}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: C.greenDark, textAlign: 'left' }}>
                      <div>{row.player.name}</div>
                      <div style={{ fontSize: 9, color: C.ash, fontFamily: "'JetBrains Mono', ui-monospace, monospace", marginTop: 1 }}>HCP {row.player.hcp.toFixed(1)}</div>
                    </td>
                    {row.rounds.map((rr, idx) => {
                      const color = rr.netToPar > 0 ? C.ink : rr.netToPar < 0 ? C.red : C.greenDark;
                      return (
                        <td key={idx} style={{ ...styles.td, ...styles.tdMono }}>
                          {rr.played > 0 ? (
                            <div>
                              <div style={{ fontWeight: 700, color: C.greenDark }}>{rr.net}</div>
                              <div style={{ fontSize: 9, color }}>{rr.netToPar > 0 ? `+${rr.netToPar}` : rr.netToPar === 0 ? 'E' : rr.netToPar}</div>
                            </div>
                          ) : <span style={{ color: C.ashLight }}>—</span>}
                        </td>
                      );
                    })}
                    <td style={{ ...styles.td, ...styles.tdMono, fontWeight: 700, color: C.greenDark, background: qualified ? C.yellowSubtle : 'transparent' }}>{row.anyPlayed ? row.totalNet : '—'}</td>
                    <td style={styles.td}>{qualified ? <span style={{ color: C.yellowDark, fontWeight: 800, fontSize: 13 }}>★</span> : <span style={{ color: C.ashLight }}>·</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// ANTI-SHTICK BOARD
// =====================================================================
function AntiShtickBoard({ meta, scores, settings, standings, projectedR5 }) {
  const asRounds = meta.rounds.filter(r => r.antiShtick);
  const allPlayed = standings.some(s => s.matchesPlayed > 0);
  const allRoundsDone = asRounds.every(r => {
    const rs = scores[r.id] || {};
    return meta.players.every(p => {
      const arr = rs[p.id] || [];
      let count = 0;
      for (let i = 0; i < 18; i++) if (safeNum(arr[i]) != null) count++;
      return count === 18;
    });
  });
  const champion = allRoundsDone && allPlayed ? standings[0] : null;
  const fmt = (n) => Number.isInteger(n) ? n : n.toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {champion && (
        <div style={styles.championBanner}>
          <Star size={16} color={C.yellowDark} fill={C.yellow} />
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.yellowDark, fontWeight: 700 }}>Anti-Shtick Champion</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: C.greenDark, lineHeight: 1 }}>{champion.team.name}</div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, color: C.greenDark }}>{fmt(champion.holesWon)}</span> total holes won
            </div>
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ padding: '12px 14px 6px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.green, fontWeight: 700 }}>Standings</div>
          <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Halves count 0.5 to each side · 4 matches per team max (72 holes available)</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Team</th>
                {asRounds.map(rc => <th key={rc.id} style={styles.th}>R{rc.n}</th>)}
                <th style={{ ...styles.th, color: C.green }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.team.id} style={i % 2 ? styles.trAlt : styles.tr}>
                  <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && allPlayed ? C.red : C.inkSoft }}>{i + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: C.greenDark, textAlign: 'left' }}>{s.team.name}</td>
                  {asRounds.map(rc => {
                    const cell = s.byRound[rc.id];
                    if (!cell) return <td key={rc.id} style={{ ...styles.td, color: C.ashLight }}>—</td>;
                    return (
                      <td key={rc.id} style={{ ...styles.td, ...styles.tdMono, fontWeight: 700, color: C.greenDark }}>
                        {fmt(cell.won)}
                        <div style={{ fontSize: 9, fontWeight: 500, color: C.ash, fontFamily: 'Manrope, sans-serif' }}>vs {cell.oppName.split(' ')[0]}</div>
                      </td>
                    );
                  })}
                  <td style={{ ...styles.td, ...styles.tdMono, fontWeight: 700, fontSize: 14, color: C.greenDark, background: i === 0 && allPlayed ? C.yellowSubtle : 'transparent' }}>{fmt(s.holesWon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.green, fontWeight: 700 }}>Live Matches</div>
          {asRounds.map(r => {
            const course = effectiveCourse(r, meta.courses);
            const matches = r.matches || [];
            const rScores = scores[r.id] || {};
            const isR5 = r.id === 'r5';
            return (
              <div key={r.id}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.inkSoft, marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                  R{r.n} {r.antiShtickLabel} <span style={{ color: C.ashLight, fontWeight: 400 }}>· {course.name}</span>
                </div>
                {isR5 && matches.length === 0 && projectedR5 && (
                  <div style={{ fontSize: 11, color: C.ash, fontStyle: 'italic', padding: '4px 0' }}>
                    Projected (lock in from R5 detail):<br />
                    • Championship: {meta.teams.find(t => t.id === projectedR5.championship.a)?.name} vs {meta.teams.find(t => t.id === projectedR5.championship.b)?.name}<br />
                    • Consolation: {meta.teams.find(t => t.id === projectedR5.consolation.a)?.name} vs {meta.teams.find(t => t.id === projectedR5.consolation.b)?.name}
                  </div>
                )}
                {isR5 && matches.length === 0 && !projectedR5 && (
                  <div style={{ fontSize: 11, color: C.ashLight, fontStyle: 'italic', padding: '4px 0' }}>Awaiting prelim rounds…</div>
                )}
                {matches.map((m, idx) => {
                  const result = computeMatch(m, rScores, meta.players, meta.teams, course, settings);
                  if (!result) return null;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < matches.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
                      <div style={{ fontSize: 13, color: C.greenDark, fontWeight: 500 }}>
                        {result.teamA.name} <span style={{ color: C.ashLight }}>vs</span> {result.teamB.name}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: C.greenDark, fontWeight: 700, textAlign: 'right' }}>{result.status}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// SKINS BOARD
// =====================================================================
function SkinsBoard({ meta, scores, settings, overall }) {
  const recentSkins = useMemo(() => {
    const events = [];
    meta.rounds.forEach(r => {
      const course = effectiveCourse(r, meta.courses);
      const { perHole } = computeSkinsForRound(scores[r.id] || {}, meta.players, course, settings);
      perHole.forEach((h, i) => {
        if (h.winner) events.push({ roundN: r.n, courseName: course.name, hole: i + 1, playerId: h.winner, value: h.value || 1 });
      });
    });
    return events;
  }, [meta, scores, settings]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={styles.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
                {meta.rounds.map(r => <th key={r.id} style={styles.th}>R{r.n}</th>)}
                <th style={{ ...styles.th, color: C.green }}>Tot</th>
              </tr>
            </thead>
            <tbody>
              {overall.map((row, i) => {
                const perRound = meta.rounds.map(r => {
                  const course = effectiveCourse(r, meta.courses);
                  const { totals } = computeSkinsForRound(scores[r.id] || {}, meta.players, course, settings);
                  return totals[row.player.id] || 0;
                });
                return (
                  <tr key={row.player.id} style={i % 2 ? styles.trAlt : styles.tr}>
                    <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && row.skins > 0 ? C.red : C.inkSoft }}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: C.greenDark, textAlign: 'left' }}>{row.player.name}</td>
                    {perRound.map((v, idx) => (
                      <td key={idx} style={{ ...styles.td, ...styles.tdMono, color: v > 0 ? C.greenDark : C.ashLight, fontWeight: v > 0 ? 700 : 400 }}>{v || '·'}</td>
                    ))}
                    <td style={{ ...styles.td, ...styles.tdMono, fontWeight: 700, color: C.greenDark, background: i === 0 && row.skins > 0 ? C.yellowSubtle : 'transparent' }}>{row.skins}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {recentSkins.length > 0 && (
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.green, fontWeight: 700 }}>Skin Wins (Live)</div>
            <div style={{ fontSize: 10, color: C.inkSoft }}>{recentSkins.length} total</div>
          </div>
          <div style={{ padding: '8px 14px', maxHeight: 220, overflowY: 'auto' }}>
            {recentSkins.slice().reverse().map((e, i) => {
              const player = meta.players.find(p => p.id === e.playerId);
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < recentSkins.length - 1 ? `1px dashed ${C.borderSoft}` : 'none', fontSize: 12 }}>
                  <div>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: C.green, fontWeight: 700 }}>R{e.roundN}·H{e.hole}</span>
                    <span style={{ color: C.ash, marginLeft: 6 }}>{e.courseName}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: C.greenDark }}>
                    {player?.name} <span style={{ color: C.yellowDark, marginLeft: 4 }}>{e.value > 1 ? `+${e.value}` : '★'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// ROUND CHIPS (used on leaderboard + rounds-list)
// =====================================================================
function RoundChip({ round, meta, scores, onClick }) {
  const course = effectiveCourse(round, meta.courses);
  const rScores = scores[round.id] || {};
  const played = meta.players.reduce((s, p) => s + ((rScores[p.id] || []).filter(v => safeNum(v) != null).length), 0);
  const total = meta.players.length * 18;
  const pct = total > 0 ? Math.round((played / total) * 100) : 0;
  const tags = [];
  if (round.hitAHouse === 'qualifier')    tags.push({ label: 'HH Qual',  tone: 'yellow' });
  if (round.hitAHouse === 'championship') tags.push({ label: 'HH Final', tone: 'red' });
  if (round.antiShtick === 'regular')     tags.push({ label: `AS ${round.antiShtickLabel.replace('Round ', 'R')}`, tone: 'green' });
  if (round.antiShtick === 'final')       tags.push({ label: 'AS Final', tone: 'red' });
  tags.push({ label: 'Skins', tone: 'neutral' });

  return (
    <button onClick={onClick} style={styles.roundChip}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, color: C.greenDark, letterSpacing: '-0.01em' }}>
            R{round.n} <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.inkSoft }}>· {course.name}</span>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.inkSoft, marginTop: 3, fontWeight: 500 }}>
            {round.date} · {round.teeTime}{round.tees ? ` · ${round.tees} (${course.rating}/${course.slope})` : ''}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{tags.map((t, i) => <Tag key={i} label={t.label} tone={t.tone} />)}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 13, fontWeight: 700, color: pct === 100 ? C.green : C.greenDark }}>{pct}%</div>
          <div style={{ fontSize: 9, color: C.ash, fontFamily: 'Manrope, sans-serif', marginTop: 1 }}>{played}/{total}</div>
          <ChevronRight size={16} color={C.green} style={{ marginTop: 4 }} />
        </div>
      </div>
    </button>
  );
}

export function RoundsListView({ meta, scores, onOpen }) {
  return (
    <div style={styles.scrollBody}>
      <SectionTitle icon={Flag} eyebrow="Tap to play" title="Rounds & Scoring"
        subtitle="Tap a round → pick your foursome → score hole by hole" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {meta.rounds.map(r => <RoundChip key={r.id} round={r} meta={meta} scores={scores} onClick={() => onOpen(r.id)} />)}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

// =====================================================================
// FOURSOME PICKER  (Round → tap your tee time)
// =====================================================================
export function FoursomePicker({ round, meta, scores, settings, me, savedFoursomeIndex, onBegin, onBack, onLockR5 }) {
  const course = effectiveCourse(round, meta.courses);
  const r5Ready = regularPhaseComplete(meta, scores);
  const r6Ready = qualifierComplete(meta, scores);

  // Locked-out screens for championship rounds before prereqs
  if (round.id === 'r5' && !r5Ready) {
    return <LockedRoundView round={round} course={course} onBack={onBack}
      reason="The Anti-Shtick Final unlocks once all 8 players finish all 18 holes of R2, R3, and R4." />;
  }
  if (round.id === 'r6' && !r6Ready) {
    return <LockedRoundView round={round} course={course} onBack={onBack}
      reason="The Hit-A-House Championship unlocks once all 8 players finish all 18 holes of R1, R2, and R4." />;
  }

  const foursomes = getRoundFoursomes(round, meta, scores, settings);

  // Pre-select the foursome containing "me", or the previously-saved index
  const findMyDefault = () => {
    if (typeof savedFoursomeIndex === 'number' && foursomes[savedFoursomeIndex]) return savedFoursomeIndex;
    if (me) {
      const idx = foursomes.findIndex(f => f.playerIds.includes(me));
      if (idx >= 0) return idx;
    }
    return 0;
  };
  const [selectedIdx, setSelectedIdx] = useState(findMyDefault);

  return (
    <div style={styles.scrollBody}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={onBack} style={styles.iconBtn}><ChevronLeft size={20} color={C.green} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: C.greenDark, letterSpacing: '-0.01em', lineHeight: 1 }}>
            R{round.n} <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.inkSoft }}>· {course.name}</span>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.inkSoft, marginTop: 3, fontWeight: 500 }}>
            {round.date} · {round.tees} ({course.rating}/{course.slope})
          </div>
        </div>
      </div>

      {round.id === 'r5' && !isR5Locked(meta) && (
        <div style={{ ...styles.card, padding: 14, marginBottom: 14, background: C.yellowPaper }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15, color: C.greenDark, marginBottom: 6 }}>Lock in finalists?</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 10, lineHeight: 1.4 }}>
            Top 2 teams play the Championship Final. Bottom 2 play the Consolation Final. Both count toward the overall AS title — bottom 2 can still win if they pile up holes.
          </div>
          <button style={styles.primaryBtn} onClick={onLockR5}>
            <Lock size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Lock in finalists
          </button>
        </div>
      )}

      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginBottom: 8 }}>
        Tap your foursome
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {foursomes.length === 0 && (
          <div style={{ padding: 14, background: C.paperAlt, borderRadius: 8, fontSize: 12, color: C.inkSoft }}>
            No foursomes are set up for this round yet. Check back once prelim rounds are complete.
          </div>
        )}
        {foursomes.map((f, idx) => {
          const selected = selectedIdx === idx;
          const includesMe = me && f.playerIds.includes(me);
          return (
            <button key={idx} onClick={() => setSelectedIdx(idx)} style={{
              ...styles.card,
              padding: 14,
              textAlign: 'left',
              cursor: 'pointer',
              borderColor: selected ? C.green : C.border,
              borderWidth: selected ? 2 : 1,
              background: selected ? C.greenPaper : C.paper,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: C.greenDark, fontSize: 17 }}>
                  {f.teeTime}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {includesMe && <Tag label="You" tone="yellow" />}
                  {f.provisional && <Tag label="Projected" tone="neutral" />}
                </div>
              </div>
              {f.matchLabel && (
                <div style={{ fontSize: 11, color: C.green, fontWeight: 600, marginBottom: 6 }}>{f.matchLabel}</div>
              )}
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>
                {f.playerIds.map(pid => {
                  const p = meta.players.find(pl => pl.id === pid);
                  if (!p) return null;
                  const isMe = pid === me;
                  return (
                    <span key={pid} style={{ marginRight: 10, color: isMe ? C.red : C.ink, fontWeight: isMe ? 700 : 500 }}>
                      {p.name}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {foursomes.length > 0 && (
        <button style={styles.bigCTA} onClick={() => onBegin(selectedIdx, foursomes[selectedIdx])}>
          Begin Round
        </button>
      )}
    </div>
  );
}

function LockedRoundView({ round, course, onBack, reason }) {
  return (
    <div style={styles.scrollBody}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={onBack} style={styles.iconBtn}><ChevronLeft size={20} color={C.green} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: C.greenDark, letterSpacing: '-0.01em', lineHeight: 1 }}>
            R{round.n} <span style={{ fontStyle: 'italic', fontWeight: 400, color: C.inkSoft }}>· {course.name}</span>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: C.inkSoft, marginTop: 3, fontWeight: 500 }}>
            {round.date} · {round.teeTime}
          </div>
        </div>
      </div>
      <div style={{ ...styles.card, padding: 24, textAlign: 'center' }}>
        <Lock size={36} color={C.ashLight} style={{ marginBottom: 12 }} />
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18, color: C.greenDark, marginBottom: 8 }}>Awaiting prelim rounds</div>
        <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5 }}>{reason}</div>
      </div>
    </div>
  );
}

// =====================================================================
// HOLE-BY-HOLE ENTRY  (the new scoring screen)
// =====================================================================
export function HoleEntry({ round, foursome, meta, scores, settings, me, onScoreUpdate, onBack, onFinish, focusedHandlers }) {
  const course = effectiveCourse(round, meta.courses);
  const refPlayer = lowestHcpPlayer(meta.players); // field-wide low for HH/skins context
  const isAS = !!round.antiShtick;

  // Match-specific low for AS rounds (within the foursome)
  const foursomePlayers = foursome.playerIds.map(pid => meta.players.find(p => p.id === pid)).filter(Boolean);
  const matchLow = lowestHcpPlayer(foursomePlayers);
  // For AS rounds, dots reflect strokes vs match low.
  // For non-AS rounds (HH/Skins only), dots reflect strokes vs field low (Alex).
  const strokeRef = isAS ? matchLow : refPlayer;
  const allowance = isAS ? (settings.handicapAllowance ?? 1.0) : 1.0;

  const [currentHole, setCurrentHole] = useState(0);
  const hole = currentHole;
  const par = course.pars[hole];
  const si = course.sis[hole];
  const maxScore = par + MAX_OVER_PAR;

  // Per-player stroke count this hole (relative to strokeRef)
  const strokesByPlayer = useMemo(() => {
    const out = {};
    foursomePlayers.forEach(p => {
      const ch = adjustedCH(p.hcp, strokeRef.hcp, course, allowance);
      out[p.id] = strokesOnHole(ch, si);
    });
    return out;
  }, [foursomePlayers, strokeRef, course, allowance, si]);

  // Pull the current scores for the foursome at this hole
  const roundScores = scores[round.id] || {};

  const goNext = () => { if (currentHole < 17) setCurrentHole(currentHole + 1); };
  const goPrev = () => { if (currentHole > 0)  setCurrentHole(currentHole - 1); };

  return (
    <div style={styles.scrollBody}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 12, color: C.green, fontWeight: 600, letterSpacing: '0.04em' }}>
            R{round.n} · {course.name}
          </div>
          <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>{foursome.teeTime} · {round.tees}</div>
        </div>
        <button onClick={onBack} style={styles.iconBtn} title="Back to Rounds">
          <X size={18} color={C.green} />
        </button>
      </div>

      {/* Hole number + par */}
      <div style={{ ...styles.holeHeader, alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkSoft, fontWeight: 700 }}>Hole</div>
          <div style={styles.holeNumberBig}>{hole + 1}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={styles.parBadge}>Par {par}</div>
          <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
            SI {si} · Max {maxScore}
          </div>
        </div>
      </div>

      {/* Player rows */}
      <div style={{ marginBottom: 18 }}>
        {foursomePlayers.map(p => (
          <PlayerHoleRow
            key={p.id}
            player={p}
            isMe={p.id === me}
            strokes={strokesByPlayer[p.id]}
            par={par}
            currentScore={(roundScores[p.id] || [])[hole]}
            onChange={(val) => onScoreUpdate(round.id, p.id, hole, val)}
            focusedHandlers={focusedHandlers}
          />
        ))}
      </div>

      {/* Foot nav */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button onClick={goPrev} disabled={currentHole === 0} style={{
          flex: 1, ...styles.secondaryBtn,
          opacity: currentHole === 0 ? 0.4 : 1,
          cursor: currentHole === 0 ? 'not-allowed' : 'pointer',
          padding: '14px',
          fontSize: 13,
        }}>
          <ChevronLeft size={14} style={{ verticalAlign: 'middle' }} /> Previous Hole
        </button>
        {currentHole < 17 ? (
          <button onClick={goNext} style={{ flex: 1, ...styles.primaryBtn, padding: '14px', fontSize: 13 }}>
            Next Hole <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
          </button>
        ) : (
          <button onClick={onFinish} style={{ flex: 1, ...styles.bigCTAYellow, padding: '14px', fontSize: 14 }}>
            Finish Round ✓
          </button>
        )}
      </div>

      {/* Hole jumper - tap any hole number to jump */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginBottom: 6 }}>Jump to hole</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 }}>
          {Array.from({ length: 18 }, (_, i) => {
            const allScored = foursomePlayers.every(p => safeNum((roundScores[p.id] || [])[i]) != null);
            const isHere = i === currentHole;
            return (
              <button key={i} onClick={() => setCurrentHole(i)} style={{
                padding: '6px 0',
                background: isHere ? C.green : allScored ? C.greenSubtle : C.paper,
                color: isHere ? C.cream : allScored ? C.green : C.inkSoft,
                border: `1px solid ${isHere ? C.green : C.border}`,
                borderRadius: 4,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}>{i + 1}</button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

function PlayerHoleRow({ player, isMe, strokes, par, currentScore, onChange, focusedHandlers }) {
  const [local, setLocal] = useState(currentScore != null ? String(currentScore) : '');
  useEffect(() => { setLocal(currentScore != null ? String(currentScore) : ''); }, [currentScore]);

  const max = par + MAX_OVER_PAR;
  const handleBlur = () => {
    focusedHandlers?.onBlur?.();
    if (local === '' || local == null) { onChange(null); return; }
    const n = parseInt(local, 10);
    if (!Number.isFinite(n) || n < 1) { setLocal(currentScore != null ? String(currentScore) : ''); return; }
    const capped = Math.min(n, max);
    setLocal(String(capped));
    onChange(capped);
  };

  // Score-against-par color (Augusta style: red for under, green for over par+1)
  let bg = C.paper, fg = C.ink;
  const n = parseInt(local, 10);
  if (Number.isFinite(n) && n > 0) {
    const d = n - par;
    if (d <= -2)      { bg = C.redSubtle;   fg = C.redDeep; }
    else if (d === -1){ bg = C.redSubtle;   fg = C.red; }
    else if (d === 0) { bg = C.paper;       fg = C.ink; }
    else if (d === 1) { bg = C.paperAlt;    fg = C.ink; }
    else              { bg = C.greenSubtle; fg = C.greenDark; }
  }

  return (
    <div style={{
      ...styles.playerScoreRow,
      borderColor: isMe ? C.yellow : C.border,
      borderWidth: isMe ? 2 : 1,
    }}>
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 600, color: C.greenDark, display: 'flex', alignItems: 'center', gap: 6 }}>
          {player.name}
          {strokes > 0 && (
            <span style={{ display: 'inline-flex', gap: 2 }}>
              {Array.from({ length: strokes }).map((_, i) => (
                <span key={i} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: C.red }} />
              ))}
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>
          HCP {player.hcp.toFixed(1)}
          {strokes > 0 && <span style={{ color: C.red, marginLeft: 8, fontWeight: 600 }}>· {strokes} stroke{strokes > 1 ? 's' : ''}</span>}
        </div>
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={focusedHandlers?.onFocus}
        onBlur={handleBlur}
        style={{ ...styles.scoreInputBig, background: bg, color: fg }}
        placeholder="–"
      />
    </div>
  );
}

// =====================================================================
// PLAYERS VIEW
// =====================================================================
export function PlayersView({ meta, settings, onUpdatePlayer, onAddPlayer, onRemovePlayer, onUpdateTeams }) {
  const ref = lowestHcpPlayer(meta.players);
  const [editTeams, setEditTeams] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);

  return (
    <div style={styles.scrollBody}>
      <SectionTitle icon={Users} eyebrow="Handicaps · Nearest 0.5" title="Players" subtitle="Edit indices · add or remove · adjust pairings" />
      <div style={styles.card}>
        {meta.players.map((p, i) => (
          <PlayerRow
            key={p.id} player={p} isRef={p.id === ref.id} isLast={i === meta.players.length - 1}
            courses={meta.courses} settings={settings} refHcp={ref.hcp}
            onUpdate={(patch) => onUpdatePlayer(p.id, patch)}
            onRemove={() => {
              if (!confirm(`Remove ${p.name}? Past scores stay in storage but the player won't appear in leaderboards.`)) return;
              onRemovePlayer(p.id);
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => setAddingPlayer(true)} style={styles.secondaryBtn}>
          <Plus size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Add Player
        </button>
        <button onClick={() => setEditTeams(true)} style={styles.secondaryBtn}>
          <Edit3 size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Edit Teams
        </button>
      </div>

      {addingPlayer && <AddPlayerModal onSave={(p) => { onAddPlayer(p); setAddingPlayer(false); }} onCancel={() => setAddingPlayer(false)} existingIds={meta.players.map(x => x.id)} />}
      {editTeams && <EditTeamsModal teams={meta.teams} players={meta.players} onSave={(teams) => { onUpdateTeams(teams); setEditTeams(false); }} onCancel={() => setEditTeams(false)} />}

      <div style={{ marginTop: 16 }}>
        <SectionTitle icon={Users} eyebrow="Teams" title="Pairings" />
        <div style={styles.card}>
          {meta.teams.map((t, i) => (
            <div key={t.id} style={{ padding: '12px 14px', borderBottom: i < meta.teams.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, color: C.greenDark }}>{t.name}</div>
              <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>
                {t.playerIds.map(pid => meta.players.find(p => p.id === pid)?.name).filter(Boolean).join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

function PlayerRow({ player, isRef, isLast, courses, settings, refHcp, onUpdate, onRemove }) {
  const [name, setName] = useState(player.name);
  const [hcp, setHcp] = useState(String(player.hcp));
  useEffect(() => { setName(player.name); setHcp(String(player.hcp)); }, [player.name, player.hcp]);

  return (
    <div style={{ padding: '14px 14px', borderBottom: isLast ? 'none' : `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input type="text" value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { if (name.trim() && name !== player.name) onUpdate({ name: name.trim() }); else setName(player.name); }}
            style={styles.nameInput} />
          {isRef && <span style={{ fontSize: 9, color: C.red, fontWeight: 700, marginLeft: 6, letterSpacing: '0.1em' }}>FIELD LOW</span>}
          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {Object.values(courses).map(c => {
              const ch = courseHandicap(player.hcp, c);
              const adj = adjustedCH(player.hcp, refHcp, c, 1.0);
              return (
                <div key={c.name} style={{ fontSize: 9.5, color: C.inkSoft }}>
                  <span style={{ letterSpacing: '0.04em' }}>{c.name.toUpperCase()}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, color: C.greenDark, marginLeft: 4 }}>{ch}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: C.red, marginLeft: 3 }}>({adj})</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="number" step="0.5" value={hcp}
            onChange={e => setHcp(e.target.value)}
            onBlur={() => {
              const rounded = roundToHalf(hcp);
              setHcp(String(rounded));
              if (rounded !== player.hcp) onUpdate({ hcp: rounded });
            }}
            style={styles.hcpInput} />
          <button onClick={onRemove} style={styles.iconDangerBtn} title="Remove player"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function AddPlayerModal({ onSave, onCancel, existingIds }) {
  const [name, setName] = useState('');
  const [hcp, setHcp] = useState('15');
  return (
    <div style={styles.modalBackdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: C.greenDark }}>Add Player</div>
          <button onClick={onCancel} style={styles.iconBtn}><X size={18} color={C.green} /></button>
        </div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <div style={styles.label}>Name</div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={styles.input} autoFocus />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={styles.label}>Handicap Index</div>
          <input type="number" step="0.5" value={hcp} onChange={e => setHcp(e.target.value)} style={styles.input} />
        </label>
        <button onClick={() => {
          if (!name.trim()) return;
          let id = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
          let n = 1;
          while (existingIds.includes(id)) { id = `${id}${n++}`; }
          onSave({ id, name: name.trim(), hcp: roundToHalf(hcp) });
        }} style={{ ...styles.primaryBtn, width: '100%' }}>Add Player</button>
      </div>
    </div>
  );
}

function EditTeamsModal({ teams, players, onSave, onCancel }) {
  const [draft, setDraft] = useState(teams.map(t => ({ ...t })));
  return (
    <div style={styles.modalBackdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: C.greenDark }}>Edit Teams</div>
          <button onClick={onCancel} style={styles.iconBtn}><X size={18} color={C.green} /></button>
        </div>
        {draft.map((t, idx) => (
          <div key={t.id} style={{ marginBottom: 14 }}>
            <input type="text" value={t.name} onChange={e => {
              const d = [...draft]; d[idx] = { ...d[idx], name: e.target.value }; setDraft(d);
            }} style={{ ...styles.input, marginBottom: 6, fontFamily: 'Fraunces, serif', fontWeight: 600 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1].map(slot => (
                <select key={slot} value={t.playerIds[slot] || ''} onChange={e => {
                  const d = [...draft];
                  const pids = [...(d[idx].playerIds || [])];
                  pids[slot] = e.target.value;
                  d[idx] = { ...d[idx], playerIds: pids.filter(Boolean) };
                  setDraft(d);
                }} style={{ ...styles.select, flex: 1 }}>
                  <option value="">— pick —</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => onSave(draft)} style={{ ...styles.primaryBtn, width: '100%' }}>Save Teams</button>
      </div>
    </div>
  );
}

// =====================================================================
// SETTINGS
// =====================================================================
export function SettingsView({ meta, settings, scores, onUpdateCourse, onUpdateSettings, onReset, onExport, onUpdateRoundTees }) {
  const [openCourseId, setOpenCourseId] = useState(null);
  return (
    <div style={styles.scrollBody}>
      <SectionTitle icon={SettingsIcon} eyebrow="Tournament" title="Rules" subtitle="Per-tournament options. Changes apply immediately." />
      <div style={styles.card}>
        <div style={{ padding: '14px 14px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 15, color: C.greenDark }}>Anti-Shtick Handicap Allowance</div>
          <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>USGA recommends 85% for four-ball. 100% = full strokes.</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10, background: C.paperAlt, padding: 3, borderRadius: 6 }}>
            {[{ v: 0.85, l: '85%' }, { v: 0.9, l: '90%' }, { v: 1.0, l: '100%' }].map(opt => (
              <button key={opt.v} onClick={() => onUpdateSettings({ handicapAllowance: opt.v })} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: 4,
                background: Math.abs(settings.handicapAllowance - opt.v) < 0.001 ? C.paper : 'transparent',
                color: C.greenDark, fontWeight: Math.abs(settings.handicapAllowance - opt.v) < 0.001 ? 700 : 500,
                fontSize: 12, cursor: 'pointer',
                boxShadow: Math.abs(settings.handicapAllowance - opt.v) < 0.001 ? `0 1px 2px ${C.shadow}` : 'none',
              }}>{opt.l}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 15, color: C.greenDark }}>Skins Carryover</div>
              <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Tied holes carry to the next hole (standard skins rule)</div>
            </div>
            <Toggle value={settings.skinsCarryover} onChange={v => onUpdateSettings({ skinsCarryover: v })} />
          </div>
        </div>
      </div>

      <SectionTitle icon={Flag} eyebrow="Rounds" title="Tees per Round" subtitle="Tap to override the tees the group is playing for any round" style={{ marginTop: 28 }} />
      <div style={styles.card}>
        {meta.rounds.map((r, i) => (
          <div key={r.id} style={{ padding: '12px 14px', borderBottom: i < meta.rounds.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 14, color: C.greenDark }}>R{r.n} · {meta.courses[r.courseId].name}</div>
              <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>{r.date} · {r.teeTime}</div>
            </div>
            <select value={r.tees || ''} onChange={e => onUpdateRoundTees(r.id, e.target.value || null)}
              style={{ ...styles.select, fontSize: 12 }}>
              <option value="">— tees —</option>
              {Object.keys(TEE_OPTIONS[r.courseId] || {}).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
      </div>

      <SectionTitle icon={SettingsIcon} eyebrow="Courses" title="Course data" subtitle="Pars and stroke indices match the official Bandon scorecards" style={{ marginTop: 28 }} />
      <div style={styles.card}>
        {Object.entries(meta.courses).map(([id, c], i, arr) => (
          <div key={id} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <button onClick={() => setOpenCourseId(openCourseId === id ? null : id)} style={{
              width: '100%', textAlign: 'left', padding: '14px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, color: C.greenDark }}>{c.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 11, color: C.inkSoft, marginTop: 2 }}>Par {c.par}</div>
              </div>
              <ChevronRight size={18} color={C.green} style={{ transform: openCourseId === id ? 'rotate(90deg)' : 'none' }} />
            </button>
            {openCourseId === id && (
              <div style={{ padding: '0 14px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 8 }}>
                  <LabeledInput label="Par" value={c.par} onChange={v => onUpdateCourse(id, { par: Number(v) })} />
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.green, fontWeight: 700, marginBottom: 6 }}>Hole-by-hole</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={styles.th}>H</th>{Array.from({ length: 18 }, (_, i) => <th key={i} style={styles.th}>{i + 1}</th>)}</tr></thead>
                    <tbody>
                      <tr><th style={{ ...styles.th, fontSize: 9, color: C.inkSoft, fontWeight: 600 }}>Par</th>
                        {c.pars.map((p, i) => (
                          <td key={i} style={{ ...styles.td, padding: 1 }}>
                            <input type="number" value={p} onChange={e => { const nv = [...c.pars]; nv[i] = Number(e.target.value); onUpdateCourse(id, { pars: nv }); }} style={styles.miniInput} />
                          </td>
                        ))}</tr>
                      <tr><th style={{ ...styles.th, fontSize: 9, color: C.inkSoft, fontWeight: 600 }}>SI</th>
                        {c.sis.map((s, i) => (
                          <td key={i} style={{ ...styles.td, padding: 1 }}>
                            <input type="number" value={s} onChange={e => { const nv = [...c.sis]; nv[i] = Number(e.target.value); onUpdateCourse(id, { sis: nv }); }} style={styles.miniInput} />
                          </td>
                        ))}</tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <SectionTitle icon={Download} eyebrow="Export" title="Save your data" subtitle="All scores as a CSV" style={{ marginTop: 28 }} />
      <button onClick={onExport} style={{ ...styles.secondaryBtn, width: '100%' }}>
        <Download size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Download CSV
      </button>

      <SectionTitle icon={AlertCircle} eyebrow="Reset" title="Danger Zone" style={{ marginTop: 28 }} />
      <button onClick={onReset} style={styles.dangerBtn}>Reset everything to defaults</button>

      <div style={{ marginTop: 24, padding: 14, background: C.yellowPaper, borderRadius: 8, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>
        <strong style={{ color: C.greenDark, fontFamily: 'Fraunces, serif' }}>How sync works:</strong> Every score change writes to Firestore atomically.
        All connected devices see updates in under a second via real-time subscriptions. Score cap = par + {MAX_OVER_PAR}.
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 26, borderRadius: 13, border: 'none', position: 'relative',
      background: value ? C.green : C.ashLight, cursor: 'pointer', transition: 'background 0.15s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20,
        borderRadius: 10, background: C.cream, transition: 'left 0.15s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}

function LabeledInput({ label, value, onChange, step }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  return (
    <label style={{ display: 'block' }}>
      <div style={styles.label}>{label}</div>
      <input type="number" step={step || '1'} value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== String(value)) onChange(local); }}
        style={styles.input} />
    </label>
  );
}
