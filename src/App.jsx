import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Trophy, Users, MapPin, Settings, ChevronLeft, ChevronRight, Flag, Edit3, Check, AlertCircle, Cloud, CloudOff, Swords, Target, Star, RefreshCw, Plus, Trash2, Download, X, User, Lock, Unlock } from 'lucide-react';
import {
  loadAll, subscribeAll,
  persistScoreCell, persistClearRound, persistMeta, persistSettings, persistMe,
  isFirebaseConfigured,
} from './storage.js';

// =====================================================================
// CONSTANTS
// =====================================================================
const SCHEMA_VERSION = 2; // bump when DEFAULT_COURSES or DEFAULT_ROUNDS structure changes

// =====================================================================
// DEFAULTS
// =====================================================================
const DEFAULT_PLAYERS = [
  { id: 'charlie', name: 'Charlie Bogart',     hcp: 12.0 },
  { id: 'alex',    name: 'Alex Lichtenberg',   hcp: 7.0  },
  { id: 'elijah',  name: 'Elijah Lichtenberg', hcp: 10.5 },
  { id: 'jmiller', name: 'Josh Miller',        hcp: 18.5 },
  { id: 'jtohl',   name: 'Josh Tohl',          hcp: 23.0 },
  { id: 'corey',   name: 'Corey Argumosa',     hcp: 13.5 },
  { id: 'ian',     name: 'Ian Finley',         hcp: 23.0 },
  { id: 'ryan',    name: 'Ryan Pleuger',       hcp: 11.0 },
];
const DEFAULT_TEAMS = [
  { id: 't1', name: 'Charlie & Alex', playerIds: ['charlie', 'alex'] },
  { id: 't2', name: 'Elijah & Corey', playerIds: ['elijah', 'corey'] },
  { id: 't3', name: 'Josh & Josh',    playerIds: ['jmiller', 'jtohl'] },
  { id: 't4', name: 'Ryan & Ian',     playerIds: ['ryan', 'ian'] },
];
const DEFAULT_COURSES = {
  trails: { name: 'Bandon Trails', par: 71, rating: 72.0, slope: 137,
    pars: [4,3,5,4,3,4,4,4,5, 4,4,3,4,4,4,5,3,4],
    sis:  [13,17,3,5,15,9,7,11,1, 10,4,18,12,14,8,2,16,6] },
  sheep:  { name: 'Sheep Ranch', par: 72, rating: 70.0, slope: 116,
    pars: [5,4,3,4,3,4,3,4,4, 4,5,4,5,4,4,3,4,5],
    sis:  [5,13,17,3,11,1,15,7,9, 6,4,2,10,8,14,16,12,18] },
  dunes:  { name: 'Bandon Dunes', par: 72, rating: 71.1, slope: 133,
    pars: [4,3,5,4,4,3,4,4,5, 4,4,3,5,4,3,4,4,5],
    sis:  [13,15,3,5,1,17,7,11,9, 8,2,18,6,16,14,10,12,4] },
  oldmac: { name: 'Old Macdonald', par: 71, rating: 71.4, slope: 127,
    pars: [4,3,4,4,3,5,4,3,4, 4,4,3,4,4,5,4,5,4],
    sis:  [11,15,9,1,17,3,5,13,7, 6,4,16,18,14,12,2,10,8] },
};
// Tee options for each course (rating/slope from official Bandon scorecards).
// Pars and stroke indices don't change across these men's tees.
const TEE_OPTIONS = {
  trails: {
    Black:        { rating: 74.9, slope: 136 },
    Green:        { rating: 72.0, slope: 137 },
    Gold:         { rating: 69.6, slope: 132 },
    'Royal Blue': { rating: 63.0, slope: 113 },
    Orange:       { rating: 66.6, slope: 125 },
  },
  sheep: {
    Black:        { rating: 71.9, slope: 121 },
    Green:        { rating: 70.0, slope: 116 },
    Gold:         { rating: 67.9, slope: 109 },
    'Royal Blue': { rating: 61.0, slope: 97  },
    Orange:       { rating: 65.0, slope: 102 },
  },
  dunes: {
    Black:        { rating: 73.5, slope: 143 },
    Green:        { rating: 71.1, slope: 133 },
    Gold:         { rating: 69.1, slope: 124 },
    'Royal Blue': { rating: 61.6, slope: 105 },
    Orange:       { rating: 65.5, slope: 114 },
  },
  oldmac: {
    Black:        { rating: 74.4, slope: 134 },
    Green:        { rating: 71.4, slope: 127 },
    Gold:         { rating: 67.8, slope: 117 },
    'Royal Blue': { rating: 62.6, slope: 104 },
    Orange:       { rating: 65.1, slope: 112 },
  },
};
const DEFAULT_ROUNDS = [
  { id: 'r1', n: 1, date: 'Fri • Aug 28', courseId: 'trails', teeTime: '11:20 / 11:40 AM', tees: 'Gold',
    hitAHouse: 'qualifier', antiShtick: null, antiShtickLabel: null, matches: [] },
  { id: 'r2', n: 2, date: 'Sat • Aug 29', courseId: 'sheep',  teeTime: '8:00 AM', tees: 'Gold',
    hitAHouse: 'qualifier', antiShtick: 'regular', antiShtickLabel: 'Round 1',
    matches: [{ a:'t1', b:'t2' }, { a:'t3', b:'t4' }] },
  { id: 'r3', n: 3, date: 'Sat • Aug 29', courseId: 'dunes',  teeTime: '1:10 PM', tees: 'Gold',
    hitAHouse: null, antiShtick: 'regular', antiShtickLabel: 'Round 2',
    matches: [{ a:'t1', b:'t3' }, { a:'t2', b:'t4' }] },
  { id: 'r4', n: 4, date: 'Sun • Aug 30', courseId: 'oldmac', teeTime: '7:00 AM', tees: 'Gold',
    hitAHouse: 'qualifier', antiShtick: 'regular', antiShtickLabel: 'Round 3',
    matches: [{ a:'t1', b:'t4' }, { a:'t2', b:'t3' }] },
  { id: 'r5', n: 5, date: 'Sun • Aug 30', courseId: 'dunes',  teeTime: '12:40 PM', tees: 'Green',
    hitAHouse: null, antiShtick: 'final', antiShtickLabel: 'Final Round', matches: [] },
  { id: 'r6', n: 6, date: 'Mon • Aug 31', courseId: 'trails', teeTime: '9:30 AM', tees: 'Green',
    hitAHouse: 'championship', antiShtick: null, antiShtickLabel: null, matches: [] },
];
const DEFAULT_SETTINGS = {
  handicapAllowance: 1.0,       // 1.0 / 0.9 / 0.85
  skinsCarryover: false,         // ties carry to next hole
  finalistsLocked: false,        // when true, finalists won't change with new scores
};

// Migration helper — call after loadAll() returns; ensures stored meta gets
// fresh course/round defaults when the SCHEMA_VERSION bumps. Preserves
// user customizations (player handicaps, teams, matchups).
async function migrateMetaIfNeeded(meta) {
  if (!meta) return meta;
  const storedVersion = meta._schemaVersion || 1;
  if (storedVersion >= SCHEMA_VERSION) return meta;
  const userMatchups = {};
  (meta.rounds || []).forEach(r => { if (r.matches) userMatchups[r.id] = r.matches; });
  const migrated = {
    ...meta,
    courses: DEFAULT_COURSES,
    rounds: DEFAULT_ROUNDS.map(r => ({
      ...r,
      matches: userMatchups[r.id] ?? r.matches ?? [],
    })),
    _schemaVersion: SCHEMA_VERSION,
  };
  await persistMeta(migrated);
  return migrated;
}

// =====================================================================
// MATH HELPERS
// =====================================================================
function roundToHalf(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 2) / 2;
}
function courseHandicap(hcpIndex, course) {
  if (!course || hcpIndex == null) return 0;
  return Math.round(hcpIndex * (course.slope / 113) + (course.rating - course.par));
}
// Returns a course object with rating/slope set from the round's tees (falls back to course defaults).
function effectiveCourse(round, courses) {
  const c = courses[round.courseId];
  if (!c) return null;
  const teeData = round?.tees ? TEE_OPTIONS[round.courseId]?.[round.tees] : null;
  return {
    ...c,
    rating: teeData?.rating ?? c.rating,
    slope: teeData?.slope ?? c.slope,
    tees: round?.tees ?? null,
  };
}
function applyAllowance(ch, allowance) {
  return Math.round(ch * (allowance ?? 1.0));
}
function strokesOnHole(ch, si) {
  if (!ch || ch <= 0) return 0;
  let strokes = 0;
  if (si <= ch) strokes += 1;
  if (si <= ch - 18) strokes += 1;
  if (si <= ch - 36) strokes += 1;
  return strokes;
}
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function isUnusualScore(score, par) {
  if (score == null) return false;
  if (score < 1 || score > 15) return true;
  if (par && score > par + 5) return true;
  return false;
}
function lowestHcpPlayer(players) {
  if (!players || players.length === 0) return null;
  return players.reduce((low, p) => p.hcp < low.hcp ? p : low, players[0]);
}
// strokes vs reference player at this course, with allowance applied
function adjustedCH(playerHcp, refHcp, course, allowance = 1.0) {
  const p = applyAllowance(courseHandicap(playerHcp, course), allowance);
  const r = applyAllowance(courseHandicap(refHcp, course), allowance);
  return Math.max(0, p - r);
}

function playerTotalsAdj(player, roundScores, course, refHcp, allowance) {
  const scores = (roundScores && roundScores[player.id]) || [];
  const aCH = adjustedCH(player.hcp, refHcp, course, allowance);
  let gross = 0, net = 0, played = 0;
  for (let i = 0; i < 18; i++) {
    const s = safeNum(scores[i]);
    if (s != null) {
      gross += s;
      net += s - strokesOnHole(aCH, course.sis[i]);
      played++;
    }
  }
  return { gross, net, played, aCH };
}

// =====================================================================
// SKINS
// =====================================================================
function computeSkinsForRound(roundScores, players, course, settings) {
  const ref = lowestHcpPlayer(players);
  if (!ref) return { perHole: Array(18).fill({ winner: null, complete: false }), totals: {} };
  const allowance = 1.0; // skins use full HCP traditionally
  const perHole = [];
  let carryover = 0;

  for (let h = 0; h < 18; h++) {
    const si = course.sis[h];
    const nets = players.map(p => {
      const gross = safeNum((roundScores[p.id] || [])[h]);
      if (gross == null) return null;
      const aCH = adjustedCH(p.hcp, ref.hcp, course, allowance);
      return { playerId: p.id, gross, net: gross - strokesOnHole(aCH, si) };
    });
    const valid = nets.filter(n => n != null);
    if (valid.length < players.length) {
      perHole.push({ winner: null, complete: false, carry: carryover });
      continue;
    }
    const minNet = Math.min(...valid.map(v => v.net));
    const winners = valid.filter(v => v.net === minNet);
    if (winners.length === 1) {
      const skinValue = 1 + carryover;
      perHole.push({ winner: winners[0].playerId, net: minNet, complete: true, value: skinValue, carry: 0 });
      carryover = 0;
    } else if (settings?.skinsCarryover) {
      carryover += 1;
      perHole.push({ winner: null, complete: true, tied: true, carry: carryover });
    } else {
      perHole.push({ winner: null, complete: true, tied: true, carry: 0 });
    }
  }

  const totals = {};
  players.forEach(p => totals[p.id] = 0);
  perHole.forEach(h => { if (h.winner) totals[h.winner] += (h.value || 1); });
  return { perHole, totals };
}

// =====================================================================
// MATCH PLAY (Anti-Shtick)
// =====================================================================
function computeMatch(match, roundScores, players, teams, course, settings) {
  const tA = teams.find(t => t.id === match.a);
  const tB = teams.find(t => t.id === match.b);
  if (!tA || !tB) return null;
  const pA = tA.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);
  const pB = tB.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);
  const four = [...pA, ...pB];
  if (four.length === 0) return null;
  const ref = lowestHcpPlayer(four);
  const allowance = settings?.handicapAllowance ?? 1.0;

  const chMap = {};
  four.forEach(p => { chMap[p.id] = adjustedCH(p.hcp, ref.hcp, course, allowance); });

  let aWon = 0, bWon = 0, halved = 0, played = 0;
  let lastPlayedHole = 0;
  for (let h = 0; h < 18; h++) {
    const si = course.sis[h];
    const nets = (pls) => pls.map(p => {
      const g = safeNum((roundScores[p.id] || [])[h]);
      if (g == null) return null;
      return g - strokesOnHole(chMap[p.id], si);
    });
    const aNets = nets(pA);
    const bNets = nets(pB);
    if (aNets.some(n => n == null) || bNets.some(n => n == null)) continue;
    const aScore = Math.min(...aNets);
    const bScore = Math.min(...bNets);
    played++;
    lastPlayedHole = h + 1;
    if (aScore < bScore) aWon++;
    else if (bScore < aScore) bWon++;
    else halved++;
  }

  const remaining = 18 - played;
  const diff = Math.abs(aWon - bWon);
  let status, points, decided = false;
  if (played === 0) { status = 'Not started'; points = null; }
  else if (played < 18) {
    if (diff > remaining) {
      const front = aWon > bWon ? tA.name : tB.name;
      status = `${front} wins ${diff}&${remaining}`;
      points = aWon > bWon ? { a: 1, b: 0 } : { a: 0, b: 1 };
      decided = true;
    } else {
      status = aWon === bWon ? `AS thru ${lastPlayedHole}` : `${aWon > bWon ? tA.name : tB.name} ${diff} UP thru ${lastPlayedHole}`;
      points = null;
    }
  } else {
    if (aWon > bWon)      { status = `${tA.name} wins ${aWon - bWon} UP`; points = { a: 1, b: 0 }; }
    else if (bWon > aWon) { status = `${tB.name} wins ${bWon - aWon} UP`; points = { a: 0, b: 1 }; }
    else                  { status = `Match Halved (AS)`; points = { a: 0.5, b: 0.5 }; }
    decided = true;
  }

  return { teamA: tA, teamB: tB, refPlayer: ref, aWon, bWon, halved, played, status, points, decided, chMap };
}

// =====================================================================
// HIT-A-HOUSE
// =====================================================================
function computeHitAHouseQualifier(meta, scores, settings) {
  const ref = lowestHcpPlayer(meta.players);
  const allowance = 1.0; // HAH uses full HCP
  const qRounds = meta.rounds.filter(r => r.hitAHouse === 'qualifier');
  const totalQ = qRounds.length;

  const rows = meta.players.map(player => {
    const rounds = qRounds.map(r => {
      const course = effectiveCourse(r, meta.courses);
      const t = playerTotalsAdj(player, scores[r.id] || {}, course, ref.hcp, allowance);
      const parToPoint = course.pars.slice(0, t.played).reduce((s, p) => s + p, 0);
      const netToPar = t.played > 0 ? t.net - parToPoint : null;
      // Also compute gross-only and best-single-round for tiebreakers
      return { roundId: r.id, courseName: course.name, ...t, netToPar, complete: t.played === 18 };
    });
    const totalNet = rounds.reduce((s, r) => s + (r.net || 0), 0);
    const totalGross = rounds.reduce((s, r) => s + (r.gross || 0), 0);
    const bestSingleNet = rounds.reduce((b, r) => (r.played > 0 && (b == null || r.net < b)) ? r.net : b, null);
    const completedRounds = rounds.filter(r => r.complete).length;
    const anyPlayed = rounds.some(r => r.played > 0);
    return { player, rounds, totalNet, totalGross, bestSingleNet, completedRounds, totalQ, anyPlayed };
  });

  // Tiebreaker: total net → best single round → fewer total gross strokes → name (stable)
  return rows.sort((a, b) => {
    if (!a.anyPlayed && !b.anyPlayed) return 0;
    if (!a.anyPlayed) return 1;
    if (!b.anyPlayed) return -1;
    if (a.totalNet !== b.totalNet) return a.totalNet - b.totalNet;
    const aBest = a.bestSingleNet ?? Infinity;
    const bBest = b.bestSingleNet ?? Infinity;
    if (aBest !== bBest) return aBest - bBest;
    if (a.totalGross !== b.totalGross) return a.totalGross - b.totalGross;
    return 0;
  });
}

function computeHitAHouseChampionship(meta, scores, settings) {
  const qualifier = computeHitAHouseQualifier(meta, scores, settings);
  const allQualifiersComplete = qualifier.every(q => q.completedRounds === q.totalQ) && qualifier.some(q => q.anyPlayed);
  const top4 = qualifier.slice(0, 4);
  const qualifiedIds = top4.map(q => q.player.id);
  const cRound = meta.rounds.find(r => r.hitAHouse === 'championship');
  if (!cRound) return { qualifier, qualifiedIds, allQualifiersComplete, cRound: null, course: null, results: [] };
  const course = effectiveCourse(cRound, meta.courses);
  const ref = lowestHcpPlayer(meta.players);
  const rScores = scores[cRound.id] || {};
  const results = qualifier
    .filter(q => qualifiedIds.includes(q.player.id))
    .map(q => {
      const t = playerTotalsAdj(q.player, rScores, course, ref.hcp, 1.0);
      return { player: q.player, ...t, qualifierTotal: q.totalNet };
    });
  results.sort((a, b) => {
    if (a.played === 0 && b.played === 0) return 0;
    if (a.played === 0) return 1;
    if (b.played === 0) return -1;
    if (a.net !== b.net) return a.net - b.net;
    // Tiebreaker: gross, then qualifier total
    if (a.gross !== b.gross) return a.gross - b.gross;
    return a.qualifierTotal - b.qualifierTotal;
  });
  return { qualifier, qualifiedIds, allQualifiersComplete, cRound, course, results };
}

// =====================================================================
// ANTI-SHTICK
// =====================================================================
function computeAntiShtickRegular(meta, scores, settings) {
  const standings = {};
  meta.teams.forEach(t => {
    standings[t.id] = {
      team: t, points: 0, w: 0, l: 0, h: 0, perRound: {},
      holesWon: 0, holesLost: 0,
    };
  });
  const regular = meta.rounds.filter(r => r.antiShtick === 'regular');
  regular.forEach(round => {
    const course = effectiveCourse(round, meta.courses);
    (round.matches || []).forEach(m => {
      const rScores = scores[round.id] || {};
      const result = computeMatch(m, rScores, meta.players, meta.teams, course, settings);
      if (!result) return;
      const aRow = standings[m.a]; const bRow = standings[m.b];
      if (!aRow || !bRow) return;
      const aTag = !result.points ? (result.played === 0 ? '—' : 'IP')
        : result.points.a === 1 ? 'W'
        : result.points.a === 0.5 ? 'H' : 'L';
      const bTag = !result.points ? (result.played === 0 ? '—' : 'IP')
        : result.points.b === 1 ? 'W'
        : result.points.b === 0.5 ? 'H' : 'L';
      aRow.perRound[round.id] = { tag: aTag, oppId: m.b, oppName: bRow.team.name };
      bRow.perRound[round.id] = { tag: bTag, oppId: m.a, oppName: aRow.team.name };
      if (result.points) {
        aRow.points += result.points.a;
        bRow.points += result.points.b;
        if (result.points.a === 1) { aRow.w++; bRow.l++; }
        else if (result.points.b === 1) { bRow.w++; aRow.l++; }
        else { aRow.h++; bRow.h++; }
      }
      aRow.holesWon += result.aWon;
      aRow.holesLost += result.bWon;
      bRow.holesWon += result.bWon;
      bRow.holesLost += result.aWon;
    });
  });
  // Tiebreaker: points → head-to-head (if applicable) → hole differential → holes won
  return Object.values(standings).sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    // Head-to-head: did one beat the other in their regular phase match?
    const aVsB = a.perRound;
    const findH2H = () => {
      for (const rid of Object.keys(aVsB)) {
        const cell = aVsB[rid];
        if (cell.oppId === b.team.id) {
          if (cell.tag === 'W') return -1;
          if (cell.tag === 'L') return 1;
        }
      }
      return 0;
    };
    const h2h = findH2H();
    if (h2h !== 0) return h2h;
    const aDiff = a.holesWon - a.holesLost;
    const bDiff = b.holesWon - b.holesLost;
    if (aDiff !== bDiff) return bDiff - aDiff;
    return b.holesWon - a.holesWon;
  });
}

function computeAntiShtickFinal(meta, scores, settings) {
  const standings = computeAntiShtickRegular(meta, scores, settings);
  const finalRound = meta.rounds.find(r => r.antiShtick === 'final');
  if (!finalRound) return { standings, finalRound: null, course: null, result: null, finalists: null, autoMatch: null };
  const course = effectiveCourse(finalRound, meta.courses);

  let finalists, autoMatch, match;
  if (finalRound.matches && finalRound.matches.length > 0) {
    const m = finalRound.matches[0];
    finalists = [meta.teams.find(t => t.id === m.a), meta.teams.find(t => t.id === m.b)].filter(Boolean);
    autoMatch = false;
    match = m;
  } else if (standings.length >= 2 && standings[0].points > 0) {
    finalists = [standings[0].team, standings[1].team];
    autoMatch = true;
    match = { a: finalists[0].id, b: finalists[1].id };
  } else {
    return { standings, finalRound, course, result: null, finalists: null, autoMatch: null };
  }

  const result = match ? computeMatch(match, scores[finalRound.id] || {}, meta.players, meta.teams, course, settings) : null;
  return { standings, finalRound, course, result, finalists, autoMatch, match };
}

function computeSkinsOverall(meta, scores, settings) {
  const totals = {};
  meta.players.forEach(p => { totals[p.id] = 0; });
  meta.rounds.forEach(r => {
    const course = effectiveCourse(r, meta.courses);
    const { totals: t } = computeSkinsForRound(scores[r.id] || {}, meta.players, course, settings);
    meta.players.forEach(p => { totals[p.id] += t[p.id] || 0; });
  });
  return meta.players.map(p => ({ player: p, skins: totals[p.id] })).sort((a, b) => b.skins - a.skins);
}

// =====================================================================
// CSV EXPORT
// =====================================================================
function exportToCSV(meta, scores) {
  const rows = [];
  rows.push(['Round', 'Course', 'Date', 'Player', 'HCP', ...Array.from({ length: 18 }, (_, i) => `H${i + 1}`), 'Gross']);
  meta.rounds.forEach(r => {
    const course = effectiveCourse(r, meta.courses);
    meta.players.forEach(p => {
      const playerScores = (scores[r.id] || {})[p.id] || Array(18).fill(null);
      const gross = playerScores.reduce((s, v) => s + (safeNum(v) || 0), 0);
      rows.push([
        `R${r.n}`, course.name, r.date, p.name, p.hcp.toFixed(1),
        ...playerScores.map(v => v ?? ''),
        gross || '',
      ]);
    });
  });
  const csv = rows.map(row => row.map(cell => {
    const s = String(cell);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bandon-tournament-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =====================================================================
// MAIN APP
// =====================================================================
export default function App() {
  const [meta, setMeta] = useState(null);
  const [scores, setScores] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('leaderboard');
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle / saving / saved / error
  const [lastSync, setLastSync] = useState(null);
  const [showMeSetup, setShowMeSetup] = useState(false);
  const focusedRef = useRef(0); // active input focus counter

  // === Initial load (one-time read from Firestore) ===
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isFirebaseConfigured) {
        // Show setup-needed screen
        setLoading(false);
        return;
      }
      const roundIds = DEFAULT_ROUNDS.map(r => r.id);
      const loaded = await loadAll(roundIds);
      if (cancelled) return;
      // Apply migration if stored meta is from an older schema
      let m = loaded.meta ? await migrateMetaIfNeeded(loaded.meta) : null;
      if (!m) {
        m = { players: DEFAULT_PLAYERS, teams: DEFAULT_TEAMS, courses: DEFAULT_COURSES, rounds: DEFAULT_ROUNDS, _schemaVersion: SCHEMA_VERSION };
        await persistMeta(m);
      }
      setMeta(m);
      setScores(loaded.scores);
      const s = { ...DEFAULT_SETTINGS, ...(loaded.settings || {}) };
      setSettings(s);
      if (!loaded.settings) await persistSettings(s);
      setMe(loaded.me);
      if (!loaded.me) setShowMeSetup(true);
      setLastSync(Date.now());
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // === Real-time subscriptions ===
  // Firestore pushes updates to all clients within ~1s. No polling needed.
  // Score updates are gated by focusedRef so live updates don't clobber
  // text being typed locally.
  const refreshScores = useCallback(() => {
    // Manual refresh button just resets the sync indicator since subscriptions are live
    setSyncStatus('saved');
    setLastSync(Date.now());
    setTimeout(() => setSyncStatus(s => s === 'saved' ? 'idle' : s), 800);
  }, []);

  useEffect(() => {
    if (loading || !isFirebaseConfigured) return;
    const roundIds = DEFAULT_ROUNDS.map(r => r.id);
    const unsubscribe = subscribeAll(roundIds, {
      onMeta: (data) => { if (data) setMeta(data); },
      onSettings: (data) => { if (data) setSettings(prev => ({ ...prev, ...data })); },
      onScores: (rid, scoresForRound) => {
        if (focusedRef.current > 0) return; // don't clobber in-progress typing
        setScores(prev => ({ ...prev, [rid]: scoresForRound }));
        setLastSync(Date.now());
      },
    });
    return unsubscribe;
  }, [loading]);

  // === Mutators ===
  const updateScore = useCallback(async (roundId, playerId, holeIdx, value) => {
    // Update local state immediately for snappy UI
    setScores(prev => {
      const round = { ...(prev[roundId] || {}) };
      const arr = round[playerId] ? [...round[playerId]] : Array(18).fill(null);
      arr[holeIdx] = value === '' || value == null ? null : Number(value);
      round[playerId] = arr;
      return { ...prev, [roundId]: round };
    });
    setSyncStatus('saving');
    const v = value === '' || value == null ? null : Number(value);
    const { ok } = await persistScoreCell(roundId, playerId, holeIdx, v);
    if (ok) {
      setSyncStatus('saved');
      setLastSync(Date.now());
      setTimeout(() => setSyncStatus(s => s === 'saved' ? 'idle' : s), 1200);
    } else {
      setSyncStatus('error');
    }
  }, []);

  const updateMeta = useCallback(async (updater) => {
    setMeta(prev => {
      const next = updater(prev);
      persistMeta(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback(async (patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      persistSettings(next);
      return next;
    });
  }, []);

  const updateMe = useCallback(async (playerId) => {
    setMe(playerId);
    persistMe(playerId);
  }, []);

  const clearRoundScores = async (roundId) => {
    if (!confirm('Clear all scores for this round?')) return;
    setScores(prev => ({ ...prev, [roundId]: {} }));
    await persistClearRound(roundId);
  };

  const resetAll = async () => {
    if (!confirm('Reset EVERYTHING to defaults? This wipes every score, every edit. There is no undo.')) return;
    setMeta({ players: DEFAULT_PLAYERS, teams: DEFAULT_TEAMS, courses: DEFAULT_COURSES, rounds: DEFAULT_ROUNDS, _schemaVersion: SCHEMA_VERSION });
    setScores({});
    setSettings(DEFAULT_SETTINGS);
    await Promise.all([
      persistMeta({ players: DEFAULT_PLAYERS, teams: DEFAULT_TEAMS, courses: DEFAULT_COURSES, rounds: DEFAULT_ROUNDS, _schemaVersion: SCHEMA_VERSION }),
      persistSettings(DEFAULT_SETTINGS),
      ...DEFAULT_ROUNDS.map(r => persistClearRound(r.id)),
    ]);
  };

  if (!isFirebaseConfigured) {
    return (
      <div style={styles.appShell}>
        <FontInjector />
        <div style={{ padding: '40px 20px', maxWidth: 500, margin: '0 auto' }}>
          <AlertCircle size={36} color="#b85c3a" style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 700, color: '#1a3a2e', marginBottom: 8 }}>
            Firebase setup required
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: '#5a6a4a', lineHeight: 1.6, marginBottom: 16 }}>
            The app can't reach its database because the Firebase config is missing. Copy <code style={{ background: '#f3ead4', padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>.env.example</code> to <code style={{ background: '#f3ead4', padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>.env</code> and fill in your Firebase project's values. On Vercel, add the same six <code style={{ background: '#f3ead4', padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>VITE_FIREBASE_*</code> variables in Project Settings → Environment Variables, then redeploy.
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#7a8c5c' }}>
            See README.md for step-by-step setup instructions.
          </div>
        </div>
      </div>
    );
  }

  if (loading || !meta) {
    return (
      <div style={styles.appShell}>
        <FontInjector />
        <div style={{ ...styles.center, minHeight: '60vh', fontFamily: 'Fraunces, serif', fontSize: 18, color: '#3a5a40' }}>
          Loading tournament…
        </div>
      </div>
    );
  }

  if (showMeSetup) {
    return (
      <div style={styles.appShell}>
        <FontInjector />
        <MeSetupView
          players={meta.players}
          onPick={(id) => { updateMe(id); setShowMeSetup(false); }}
          onSkip={() => setShowMeSetup(false)}
        />
      </div>
    );
  }

  const currentRound = currentRoundId ? meta.rounds.find(r => r.id === currentRoundId) : null;
  const focusedHandlers = {
    onFocus: () => { focusedRef.current += 1; },
    onBlur: () => { focusedRef.current = Math.max(0, focusedRef.current - 1); },
  };

  return (
    <div style={styles.appShell}>
      <FontInjector />
      <Header
        syncStatus={syncStatus} lastSync={lastSync} me={me} players={meta.players}
        onChangeMe={() => setShowMeSetup(true)} onRefresh={refreshScores}
      />
      {view === 'leaderboard' && (
        <LeaderboardView
          meta={meta} scores={scores} settings={settings}
          onOpenRound={(rid) => { setCurrentRoundId(rid); setView('round'); }}
        />
      )}
      {view === 'rounds' && (
        <RoundsListView meta={meta} scores={scores} onOpen={(rid) => { setCurrentRoundId(rid); setView('round'); }} />
      )}
      {view === 'round' && currentRound && (
        <RoundDetailView
          meta={meta} scores={scores} settings={settings} me={me} round={currentRound}
          onBack={() => setView('rounds')}
          onUpdateScore={updateScore}
          onUpdateMatchups={(matches) => updateMeta(m => ({ ...m, rounds: m.rounds.map(r => r.id === currentRound.id ? { ...r, matches } : r) }))}
          onUpdateTees={(tees) => updateMeta(m => ({ ...m, rounds: m.rounds.map(r => r.id === currentRound.id ? { ...r, tees } : r) }))}
          onClearScores={() => clearRoundScores(currentRound.id)}
          focusedHandlers={focusedHandlers}
        />
      )}
      {view === 'players' && (
        <PlayersView
          meta={meta} settings={settings}
          onUpdatePlayer={(id, patch) => updateMeta(m => ({ ...m, players: m.players.map(p => p.id === id ? { ...p, ...patch } : p) }))}
          onAddPlayer={(p) => updateMeta(m => ({ ...m, players: [...m.players, p] }))}
          onRemovePlayer={(id) => updateMeta(m => ({
            ...m,
            players: m.players.filter(p => p.id !== id),
            teams: m.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(pid => pid !== id) })),
          }))}
          onUpdateTeams={(teams) => updateMeta(m => ({ ...m, teams }))}
        />
      )}
      {view === 'settings' && (
        <SettingsView
          meta={meta} settings={settings} scores={scores}
          onUpdateCourse={(id, patch) => updateMeta(m => ({ ...m, courses: { ...m.courses, [id]: { ...m.courses[id], ...patch } } }))}
          onUpdateSettings={updateSettings}
          onReset={resetAll}
          onExport={() => exportToCSV(meta, scores)}
        />
      )}
      <BottomNav view={view} setView={setView} />
    </div>
  );
}

// =====================================================================
// SHARED UI
// =====================================================================
function FontInjector() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,700;9..144,900&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; }
      button { font-family: inherit; }
      select { font-family: inherit; }
      ::-webkit-scrollbar { height: 6px; width: 6px; }
      ::-webkit-scrollbar-thumb { background: rgba(58, 90, 64, 0.3); border-radius: 3px; }
    `}</style>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function Header({ syncStatus, lastSync, me, players, onChangeMe, onRefresh }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const myPlayer = players.find(p => p.id === me);
  return (
    <div style={styles.header}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: '#1a3a2e', lineHeight: 1 }}>
            Bandon <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#7a8c5c' }}>Dunes</span>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7a8c5c', fontWeight: 600 }}>
            Aug 28 – 31
          </div>
        </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Manrope, sans-serif', fontSize: 10, color: '#5a6a4a', fontWeight: 500 }}>
          {syncStatus === 'saving' && <><Cloud size={11} /> Syncing</>}
          {syncStatus === 'saved' && <><Check size={11} color="#3a7a3a" /> <span style={{ color: '#3a7a3a' }}>Synced</span></>}
          {syncStatus === 'error' && <><CloudOff size={11} color="#b85c3a" /> <span style={{ color: '#b85c3a' }}>Offline</span></>}
          {syncStatus === 'idle' && <span>{timeAgo(lastSync)}</span>}
        </div>
      </div>
    </div>
  );
}

function BottomNav({ view, setView }) {
  const tabs = [
    { id: 'leaderboard', label: 'Boards', icon: Trophy },
    { id: 'rounds',      label: 'Rounds', icon: Flag },
    { id: 'players',     label: 'Players', icon: Users },
    { id: 'settings',    label: 'Setup', icon: Settings },
  ];
  return (
    <div style={styles.bottomNav}>
      {tabs.map(t => {
        const Icon = t.icon;
        const active = view === t.id || (t.id === 'rounds' && view === 'round');
        return (
          <button key={t.id} onClick={() => setView(t.id)} style={{ ...styles.navBtn, color: active ? '#1a3a2e' : '#8a9a7a' }}>
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
        {Icon && <Icon size={14} color="#7a8c5c" strokeWidth={2.2} />}
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7a8c5c' }}>{eyebrow}</div>
      </div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: '#1a3a2e', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</div>
      {subtitle && <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#7a8c5c', marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}

function Tag({ label, tone }) {
  const palette = {
    green:   { bg: '#e3ecd9', fg: '#3a5a40' },
    orange:  { bg: '#f5e0d0', fg: '#9c4a28' },
    neutral: { bg: '#ece6d3', fg: '#7a6a4a' },
    gold:    { bg: '#f6ead0', fg: '#8a6b1f' },
    red:     { bg: '#f3dcd0', fg: '#a14025' },
  }[tone] || { bg: '#eee', fg: '#555' };
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 3, background: palette.bg, color: palette.fg }}>
      {label}
    </div>
  );
}

// =====================================================================
// "WHO ARE YOU" SETUP
// =====================================================================
function MeSetupView({ players, onPick, onSkip }) {
  return (
    <div style={{ ...styles.scrollBody, paddingTop: 60 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Trophy size={36} color="#b85c3a" style={{ marginBottom: 16 }} />
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: '#1a3a2e', letterSpacing: '-0.02em' }}>Which one are you?</div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#7a8c5c', marginTop: 8, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
          We'll default to your card during score entry. You can still tap others to enter their scores.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map(p => (
          <button key={p.id} onClick={() => onPick(p.id)} style={styles.meChoice}>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 17, color: '#1a3a2e' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#7a8c5c', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>HCP {p.hcp.toFixed(1)}</div>
            </div>
            <ChevronRight size={18} color="#7a8c5c" />
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
function LeaderboardView({ meta, scores, settings, onOpenRound }) {
  const hahCh = useMemo(() => computeHitAHouseChampionship(meta, scores, settings), [meta, scores, settings]);
  const asFinal = useMemo(() => computeAntiShtickFinal(meta, scores, settings), [meta, scores, settings]);
  const skinsOverall = useMemo(() => computeSkinsOverall(meta, scores, settings), [meta, scores, settings]);

  return (
    <div style={styles.scrollBody}>
      <SectionTitle
        icon={Trophy}
        eyebrow="Individual · Net"
        title="Hit-A-House Championship"
        subtitle="Fri/Sat/Sun mornings qualify · Top 4 play Mon for the title · Strokes off Alex"
      />
      <HitAHouseBoard hahCh={hahCh} meta={meta} />

      <SectionTitle
        icon={Swords}
        eyebrow="Teams · Match Play"
        title="Anti-Shtick Invitational"
        subtitle="3 rounds round-robin · Top 2 meet Sun PM · Per-foursome low handicap"
        style={{ marginTop: 28 }}
      />
      <AntiShtickBoard asFinal={asFinal} meta={meta} scores={scores} settings={settings} />

      <SectionTitle
        icon={Target}
        eyebrow="Side Game"
        title="Skins"
        subtitle={settings.skinsCarryover ? 'Strokes off field low · ties CARRY OVER' : 'Strokes off field low · ties = no skin'}
        style={{ marginTop: 28 }}
      />
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
          <Star size={16} color="#b85c3a" fill="#b85c3a" />
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9c4a28', fontWeight: 700 }}>Hit-A-House Champion</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: '#1a3a2e', lineHeight: 1 }}>{results[0].player.name}</div>
            <div style={{ fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>
              Monday net <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e' }}>{results[0].net}</span>
            </div>
          </div>
        </div>
      )}

      {cRound && (
        <div style={styles.card}>
          <div style={{ padding: '12px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7a8c5c', fontWeight: 700 }}>Championship Round</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 600, color: '#1a3a2e' }}>{cCourse?.name} · Mon Aug 31</div>
            </div>
            <Tag label="HH Final" tone="red" />
          </div>
          {!allQualifiersComplete && (
            <div style={{ padding: '6px 14px', fontSize: 11, color: '#9c4a28', background: '#f5e0d0', borderTop: '1px solid #e8c5b5' }}>
              ⚠ Qualifier not yet complete — top 4 is provisional ({completedQRounds}/{totalQRounds} rounds done across the field)
            </div>
          )}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
                <th style={styles.th}>Gross</th>
                <th style={{ ...styles.th, color: '#1a3a2e' }}>Net</th>
                <th style={styles.th}>Thru</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.player.id} style={i % 2 ? styles.trAlt : styles.tr}>
                  <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && r.played > 0 ? '#b85c3a' : '#5a6a4a' }}>
                    {r.played > 0 ? i + 1 : '–'}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#1a3a2e' }}>{r.player.name}</td>
                  <td style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace' }}>{r.played > 0 ? r.gross : '—'}</td>
                  <td style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e', background: i === 0 && r.played > 0 ? '#f3ead4' : 'transparent' }}>
                    {r.played > 0 ? r.net : '—'}
                  </td>
                  <td style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', color: '#7a8c5c', fontSize: 11 }}>{r.played}/18</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={5} style={{ ...styles.td, color: '#a5b095', padding: 16 }}>Top 4 qualifiers haven't been determined yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ padding: '12px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7a8c5c', fontWeight: 700 }}>
              Qualifier {allQualifiersComplete ? 'Final' : 'Standings'}
            </div>
            <div style={{ fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>
              Top 4 advance · Tiebreakers: best single round → lowest gross
            </div>
          </div>
          {!allQualifiersComplete && (
            <div style={{ fontSize: 9, color: '#9c4a28', fontWeight: 700, letterSpacing: '0.1em' }}>
              PROVISIONAL
            </div>
          )}
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
                <th style={{ ...styles.th, color: '#1a3a2e' }}>Net</th>
                <th style={styles.th}>Q</th>
              </tr>
            </thead>
            <tbody>
              {qualifier.map((row, i) => {
                const qualified = qualifiedIds.includes(row.player.id) && row.anyPlayed;
                return (
                  <tr key={row.player.id} style={i % 2 ? styles.trAlt : styles.tr}>
                    <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && row.anyPlayed ? '#b85c3a' : '#5a6a4a' }}>
                      {row.anyPlayed ? i + 1 : '–'}
                    </td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#1a3a2e' }}>
                      <div>{row.player.name}</div>
                      <div style={{ fontSize: 9, color: '#8a9a7a', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>HCP {row.player.hcp.toFixed(1)}</div>
                    </td>
                    {row.rounds.map((rr, idx) => (
                      <td key={idx} style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace' }}>
                        {rr.played > 0 ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#1a3a2e' }}>{rr.net}</div>
                            <div style={{ fontSize: 9, color: rr.netToPar > 0 ? '#b85c3a' : rr.netToPar < 0 ? '#3a7a3a' : '#5a6a4a' }}>
                              {rr.netToPar > 0 ? `+${rr.netToPar}` : rr.netToPar === 0 ? 'E' : rr.netToPar}
                            </div>
                          </div>
                        ) : <span style={{ color: '#c5cab5' }}>—</span>}
                      </td>
                    ))}
                    <td style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e', background: qualified ? '#f3ead4' : 'transparent' }}>
                      {row.anyPlayed ? row.totalNet : '—'}
                    </td>
                    <td style={styles.td}>
                      {qualified ? <span style={{ color: '#b85c3a', fontWeight: 800, fontSize: 13 }}>★</span> : <span style={{ color: '#c5cab5' }}>·</span>}
                    </td>
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
function AntiShtickBoard({ asFinal, meta, scores, settings }) {
  const { standings, finalRound, course: fCourse, result: finalResult, finalists, autoMatch } = asFinal;
  const finalDecided = !!(finalResult?.points && finalResult.played === 18);
  const champion = finalDecided ? (finalResult.points.a === 1 ? finalResult.teamA : finalResult.points.b === 1 ? finalResult.teamB : null) : null;
  const roundCols = meta.rounds.filter(r => r.antiShtick);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {champion && (
        <div style={styles.championBanner}>
          <Star size={16} color="#b85c3a" fill="#b85c3a" />
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9c4a28', fontWeight: 700 }}>Anti-Shtick Champion</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: '#1a3a2e', lineHeight: 1 }}>{champion.name}</div>
            <div style={{ fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>{finalResult.status}</div>
          </div>
        </div>
      )}

      {finalRound && (
        <div style={styles.card}>
          <div style={{ padding: '12px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7a8c5c', fontWeight: 700 }}>Final Round</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 600, color: '#1a3a2e' }}>{fCourse?.name} · Sun PM</div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {!autoMatch && <Lock size={12} color="#7a8c5c" />}
              <Tag label="AS Final" tone="red" />
            </div>
          </div>
          <div style={{ padding: '4px 14px 14px' }}>
            {finalists ? (
              <>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600, color: '#1a3a2e' }}>
                  {finalists[0].name} <span style={{ color: '#a5b095', fontStyle: 'italic', fontWeight: 400 }}>vs</span> {finalists[1].name}
                </div>
                <div style={{ marginTop: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: finalDecided ? '#b85c3a' : '#1a3a2e' }}>
                  {finalResult?.status || 'Not started'}
                </div>
                <div style={{ marginTop: 4, fontSize: 10, color: '#8a9a7a' }}>
                  {autoMatch ? 'Auto-projected from current standings. Open the Final round to lock in.' : 'Locked. Stays put as new scores come in.'}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#7a8c5c' }}>Need scores from at least one regular round to project the finalists.</div>
            )}
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={{ padding: '12px 14px 6px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#7a8c5c', fontWeight: 700 }}>Regular Phase Standings</div>
          <div style={{ fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>Top 2 advance · Tiebreakers: head-to-head → hole differential</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
                <th style={{ ...styles.th, textAlign: 'left' }}>Team</th>
                {roundCols.map(rc => <th key={rc.id} style={styles.th}>{rc.antiShtickLabel.replace('Round ', 'R').replace('Final Round', 'Final')}</th>)}
                <th style={{ ...styles.th, color: '#1a3a2e' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const advanced = i < 2 && s.points > 0;
                return (
                  <tr key={s.team.id} style={i % 2 ? styles.trAlt : styles.tr}>
                    <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && s.points > 0 ? '#b85c3a' : '#5a6a4a' }}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#1a3a2e' }}>{s.team.name}</td>
                    {roundCols.map(rc => {
                      if (rc.antiShtick === 'final') {
                        const isFinalist = finalists && (finalists[0].id === s.team.id || finalists[1].id === s.team.id);
                        if (!isFinalist) return <td key={rc.id} style={{ ...styles.td, color: '#c5cab5' }}>—</td>;
                        const fr = finalResult;
                        if (!fr || fr.played === 0) return <td key={rc.id} style={{ ...styles.td, color: '#7a8c5c', fontSize: 10 }}>vs</td>;
                        let tag = 'IP', color = '#5a6a4a';
                        if (fr.points) {
                          const isA = fr.teamA.id === s.team.id;
                          if (fr.points.a === 0.5) { tag = 'H'; color = '#7a8c5c'; }
                          else if ((fr.points.a === 1 && isA) || (fr.points.b === 1 && !isA)) { tag = 'W'; color = '#3a7a3a'; }
                          else { tag = 'L'; color = '#b85c3a'; }
                        }
                        return <td key={rc.id} style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>{tag}</td>;
                      }
                      const cell = s.perRound[rc.id];
                      if (!cell) return <td key={rc.id} style={{ ...styles.td, color: '#c5cab5' }}>—</td>;
                      const color = cell.tag === 'W' ? '#3a7a3a' : cell.tag === 'L' ? '#b85c3a' : cell.tag === 'H' ? '#7a8c5c' : '#5a6a4a';
                      return <td key={rc.id} style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>{cell.tag}</td>;
                    })}
                    <td style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e', background: advanced ? '#f3ead4' : 'transparent' }}>{s.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: '1px solid #e8e1cc', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a8c5c', fontWeight: 700 }}>Live Matches</div>
          {meta.rounds.filter(r => r.antiShtick).map(r => {
            const course = effectiveCourse(r, meta.courses);
            const matches = r.matches || [];
            const rScores = scores[r.id] || {};
            return (
              <div key={r.id}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#5a6a4a', marginBottom: 4, fontFamily: 'Manrope, sans-serif' }}>
                  {r.antiShtickLabel} <span style={{ color: '#a5b095', fontWeight: 400 }}>· {course.name} · {r.date}</span>
                </div>
                {matches.length === 0 && r.antiShtick === 'final' && finalists && (
                  <div style={{ fontSize: 11, color: '#8a9a7a', fontStyle: 'italic', padding: '4px 0' }}>
                    Projected: {finalists[0].name} vs {finalists[1].name}
                  </div>
                )}
                {matches.map((m, idx) => {
                  const result = computeMatch(m, rScores, meta.players, meta.teams, course, settings);
                  if (!result) return null;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < matches.length - 1 ? '1px dashed #e8e1cc' : 'none' }}>
                      <div style={{ fontSize: 13, color: '#1a3a2e', fontWeight: 500 }}>
                        {result.teamA.name} <span style={{ color: '#a5b095' }}>vs</span> {result.teamB.name}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: result.points ? '#1a3a2e' : '#7a8c5c', fontWeight: result.points ? 700 : 500, textAlign: 'right' }}>
                        {result.status}
                      </div>
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
  return (
    <div style={styles.card}>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: 'left', paddingLeft: 14 }}>#</th>
              <th style={{ ...styles.th, textAlign: 'left' }}>Player</th>
              {meta.rounds.map(r => <th key={r.id} style={styles.th}>R{r.n}</th>)}
              <th style={{ ...styles.th, color: '#1a3a2e' }}>Tot</th>
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
                  <td style={{ ...styles.td, paddingLeft: 14, fontFamily: 'Fraunces, serif', fontWeight: 700, color: i === 0 && row.skins > 0 ? '#b85c3a' : '#5a6a4a' }}>{i + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#1a3a2e' }}>{row.player.name}</td>
                  {perRound.map((v, idx) => (
                    <td key={idx} style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', color: v > 0 ? '#1a3a2e' : '#c5cab5', fontWeight: v > 0 ? 600 : 400 }}>{v || '·'}</td>
                  ))}
                  <td style={{ ...styles.td, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e', background: i === 0 && row.skins > 0 ? '#f3ead4' : 'transparent' }}>{row.skins}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================================
// ROUND CHIP
// =====================================================================
function RoundChip({ round, meta, scores, onClick }) {
  const course = effectiveCourse(round, meta.courses);
  const rScores = scores[round.id] || {};
  const played = meta.players.reduce((s, p) => s + ((rScores[p.id] || []).filter(v => safeNum(v) != null).length), 0);
  const total = meta.players.length * 18;
  const pct = total > 0 ? Math.round((played / total) * 100) : 0;
  const tags = [];
  if (round.hitAHouse === 'qualifier') tags.push({ label: 'HH Qual', tone: 'gold' });
  if (round.hitAHouse === 'championship') tags.push({ label: 'HH Final', tone: 'red' });
  if (round.antiShtick === 'regular') tags.push({ label: `AS ${round.antiShtickLabel.replace('Round ', 'R')}`, tone: 'green' });
  if (round.antiShtick === 'final') tags.push({ label: 'AS Final', tone: 'red' });
  tags.push({ label: 'Skins', tone: 'neutral' });

  return (
    <button onClick={onClick} style={styles.roundChip}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 700, color: '#1a3a2e', letterSpacing: '-0.01em' }}>
            R{round.n} <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#7a8c5c' }}>· {course.name}</span>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#7a8c5c', marginTop: 3, fontWeight: 500 }}>
            {round.date} · {round.teeTime}{round.tees ? ` · ${round.tees} (${course.rating}/${course.slope})` : ''}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {tags.map((t, i) => <Tag key={i} label={t.label} tone={t.tone} />)}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: pct === 100 ? '#3a7a3a' : '#1a3a2e' }}>{pct}%</div>
          <div style={{ fontSize: 9, color: '#8a9a7a', fontFamily: 'Manrope, sans-serif', marginTop: 1 }}>{played}/{total}</div>
          <ChevronRight size={16} color="#7a8c5c" style={{ marginTop: 4 }} />
        </div>
      </div>
    </button>
  );
}

function RoundsListView({ meta, scores, onOpen }) {
  return (
    <div style={styles.scrollBody}>
      <SectionTitle icon={Flag} eyebrow="Tap to enter scores" title="All Rounds" subtitle="6 rounds across 4 days · everyone sees updates live" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {meta.rounds.map(r => <RoundChip key={r.id} round={r} meta={meta} scores={scores} onClick={() => onOpen(r.id)} />)}
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

// =====================================================================
// ROUND DETAIL & SCORE ENTRY
// =====================================================================
function RoundDetailView({ meta, scores, settings, me, round, onBack, onUpdateScore, onUpdateMatchups, onUpdateTees, onClearScores, focusedHandlers }) {
  const course = effectiveCourse(round, meta.courses);
  const rScores = scores[round.id] || {};
  const refPlayer = lowestHcpPlayer(meta.players);

  const [activePlayerId, setActivePlayerId] = useState(me || meta.players[0].id);
  const [activeNine, setActiveNine] = useState('front');
  const [editingMatch, setEditingMatch] = useState(false);

  useEffect(() => { if (me) setActivePlayerId(me); }, [me]);

  const player = meta.players.find(p => p.id === activePlayerId);
  const playerScores = rScores[player.id] || Array(18).fill(null);

  // Determine which match (if any) this player is in for AS rounds
  const playerMatch = round.antiShtick ? (round.matches || []).find(m => {
    const tA = meta.teams.find(t => t.id === m.a);
    const tB = meta.teams.find(t => t.id === m.b);
    return (tA?.playerIds.includes(player.id)) || (tB?.playerIds.includes(player.id));
  }) : null;

  let strokeReference = refPlayer; // field-wide low (Alex)
  let strokeContext = 'field';
  if (playerMatch && round.antiShtick) {
    const tA = meta.teams.find(t => t.id === playerMatch.a);
    const tB = meta.teams.find(t => t.id === playerMatch.b);
    const matchPlayers = [...tA.playerIds, ...tB.playerIds].map(id => meta.players.find(p => p.id === id)).filter(Boolean);
    strokeReference = lowestHcpPlayer(matchPlayers);
    strokeContext = 'match';
  }

  const allowance = round.antiShtick ? settings.handicapAllowance : 1.0;
  const rawCH = courseHandicap(player.hcp, course);
  const displayedCH = adjustedCH(player.hcp, strokeReference.hcp, course, allowance);
  const fieldCH = adjustedCH(player.hcp, refPlayer.hcp, course, 1.0);

  const holes = activeNine === 'front' ? [0,1,2,3,4,5,6,7,8] : activeNine === 'back' ? [9,10,11,12,13,14,15,16,17] : Array.from({ length: 18 }, (_, i) => i);

  const totals = playerTotalsAdj(player, rScores, course, refPlayer.hcp, 1.0);
  const skinsThisRound = useMemo(() => computeSkinsForRound(rScores, meta.players, course, settings), [rScores, meta.players, course, settings]);

  // Lock-in finalists button: for AS final, copy projected matchup into round.matches
  const asFinal = useMemo(() => computeAntiShtickFinal(meta, scores, settings), [meta, scores, settings]);

  return (
    <div style={styles.scrollBody}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={onBack} style={styles.iconBtn}><ChevronLeft size={20} color="#1a3a2e" /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: '#1a3a2e', letterSpacing: '-0.01em', lineHeight: 1 }}>
            R{round.n} <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#7a8c5c' }}>· {course.name}</span>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#7a8c5c', marginTop: 3, fontWeight: 500 }}>
            {round.date} · {round.teeTime} · Par {course.par}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
            <select value={round.tees || ''} onChange={e => onUpdateTees(e.target.value || null)} style={{
              ...styles.select, padding: '3px 6px', fontSize: 11, fontWeight: 600, color: '#1a3a2e',
              background: '#f3ead4', borderColor: '#e8e1cc',
            }}>
              <option value="">— pick tees —</option>
              {Object.keys(TEE_OPTIONS[round.courseId] || {}).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7a8c5c' }}>
              {course.rating}/{course.slope}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
            {round.hitAHouse === 'qualifier' && <Tag label="HH Qualifier" tone="gold" />}
            {round.hitAHouse === 'championship' && <Tag label="HH Championship" tone="red" />}
            {round.antiShtick && <Tag label={`AS ${round.antiShtickLabel}`} tone={round.antiShtick === 'final' ? 'red' : 'green'} />}
            <Tag label="Skins" tone="neutral" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
        {meta.players.map(p => {
          const t = playerTotalsAdj(p, rScores, course, refPlayer.hcp, 1.0);
          const active = p.id === activePlayerId;
          const isMe = p.id === me;
          return (
            <button key={p.id} onClick={() => setActivePlayerId(p.id)} style={{
              ...styles.playerTab,
              background: active ? '#1a3a2e' : '#fbf7ec',
              color: active ? '#fbf7ec' : '#1a3a2e',
              borderColor: isMe && !active ? '#b85c3a' : active ? '#1a3a2e' : '#e8e1cc',
              borderWidth: isMe ? 2 : 1,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                {isMe && <User size={9} />}{p.name.split(' ')[0]}
              </div>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', opacity: 0.8, marginTop: 1 }}>
                {t.played > 0 ? `${t.gross} (${t.net}n)` : `HCP ${p.hcp.toFixed(1)}`}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ ...styles.card, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18, color: '#1a3a2e' }}>{player.name}</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>
              Index {player.hcp.toFixed(1)} → Course Hcp <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e' }}>{rawCH}</span>
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, color: '#7a8c5c', marginTop: 3 }}>
              {strokeContext === 'match' ? (
                <>vs match low ({strokeReference.name.split(' ')[0]}): <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#b85c3a' }}>{displayedCH}</span> strokes</>
              ) : (
                <>vs field low ({strokeReference.name.split(' ')[0]}): <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#b85c3a' }}>{displayedCH}</span> strokes</>
              )}
              {strokeContext === 'match' && fieldCH !== displayedCH && (
                <span style={{ color: '#a5b095', marginLeft: 6 }}>(field: {fieldCH})</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7a8c5c' }}>
              GROSS <span style={{ fontWeight: 700, color: '#1a3a2e', fontSize: 14 }}>{totals.gross || '—'}</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7a8c5c', marginTop: 3 }}>
              NET <span style={{ fontWeight: 700, color: '#1a3a2e', fontSize: 14 }}>{totals.net || '—'}</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#8a9a7a', marginTop: 2 }}>{totals.played}/18 holes</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10, background: '#f0ead7', padding: 3, borderRadius: 6 }}>
        {['front', 'back', 'all'].map(n => (
          <button key={n} onClick={() => setActiveNine(n)} style={{
            flex: 1, padding: '6px 8px', border: 'none', borderRadius: 4,
            background: activeNine === n ? '#fbf7ec' : 'transparent',
            color: '#1a3a2e', fontWeight: activeNine === n ? 700 : 500,
            fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
            boxShadow: activeNine === n ? '0 1px 2px rgba(0,0,0,0.06)' : 'none', cursor: 'pointer',
          }}>{n === 'front' ? 'Front 9' : n === 'back' ? 'Back 9' : 'All 18'}</button>
        ))}
      </div>

      <div style={styles.card}>
        <ScoreCard
          holes={holes} course={course} displayedCH={displayedCH} playerScores={playerScores}
          onChange={(i, v) => onUpdateScore(round.id, player.id, i, v)}
          skinsThisRound={skinsThisRound} playerId={player.id}
          strokeContext={strokeContext}
          focusedHandlers={focusedHandlers}
        />
      </div>

      {round.antiShtick && (
        <div style={{ marginTop: 16 }}>
          <SectionTitle icon={Swords} eyebrow={`Anti-Shtick · ${round.antiShtickLabel}`} title="Matchups & Live Status"
            subtitle={round.antiShtick === 'final' ? 'Top 2 from regular phase. Lock in once R3 is complete.' : 'Round-robin: each team plays each other once across R1–R3.'}
          />
          <MatchPlayPanel
            round={round} meta={meta} rScores={rScores} settings={settings}
            editing={editingMatch} setEditing={setEditingMatch}
            onUpdateMatchups={onUpdateMatchups}
            asFinalProjection={asFinal}
          />
        </div>
      )}

      <button onClick={onClearScores} style={{ ...styles.dangerBtn, marginTop: 16 }}>Clear all scores for this round</button>
      <div style={{ height: 80 }} />
    </div>
  );
}

function ScoreCard({ holes, course, displayedCH, playerScores, onChange, skinsThisRound, playerId, strokeContext, focusedHandlers }) {
  const inputRefs = useRef([]);
  const focusNext = (currentIdx) => {
    const currentPosInHoles = holes.indexOf(currentIdx);
    if (currentPosInHoles >= 0 && currentPosInHoles < holes.length - 1) {
      const nextIdx = holes[currentPosInHoles + 1];
      const next = inputRefs.current[nextIdx];
      if (next) next.focus();
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.cardTable}>
        <thead>
          <tr>
            <th style={styles.cardTh}>H</th>
            {holes.map(i => <th key={i} style={styles.cardTh}>{i + 1}</th>)}
            <th style={{ ...styles.cardTh, background: '#f3ead4' }}>T</th>
          </tr>
          <tr>
            <th style={{ ...styles.cardTh, fontSize: 9, fontWeight: 500, color: '#8a9a7a' }}>Par</th>
            {holes.map(i => <td key={i} style={{ ...styles.cardTd, color: '#8a9a7a', fontSize: 10 }}>{course.pars[i]}</td>)}
            <td style={{ ...styles.cardTd, color: '#5a6a4a', fontSize: 10, fontWeight: 600, background: '#f3ead4' }}>
              {holes.reduce((s, i) => s + course.pars[i], 0)}
            </td>
          </tr>
          <tr>
            <th style={{ ...styles.cardTh, fontSize: 9, fontWeight: 500, color: '#8a9a7a' }}>SI</th>
            {holes.map(i => {
              const strokes = strokesOnHole(displayedCH, course.sis[i]);
              return (
                <td key={i} style={{ ...styles.cardTd, color: '#8a9a7a', fontSize: 9 }}>
                  {course.sis[i]}
                  {strokes > 0 && <div style={{ fontSize: 8, color: '#b85c3a', fontWeight: 700 }}>{'•'.repeat(strokes)}</div>}
                </td>
              );
            })}
            <td style={{ ...styles.cardTd, background: '#f3ead4' }}></td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={{ ...styles.cardTh, color: '#1a3a2e', fontWeight: 700 }}>You</th>
            {holes.map(i => {
              const v = playerScores[i];
              const par = course.pars[i];
              const gotSkin = skinsThisRound.perHole[i]?.winner === playerId;
              const unusual = isUnusualScore(v, par);
              let bg = '#fbf7ec';
              if (v != null && par) {
                const diff = v - par;
                if (diff <= -2) bg = '#e3ecd9';
                else if (diff === -1) bg = '#eef2dc';
                else if (diff === 1) bg = '#f9eedc';
                else if (diff >= 2) bg = '#f3dcd0';
              }
              return (
                <td key={i} style={{ ...styles.cardTd, padding: 2, background: bg, position: 'relative' }}>
                  <input
                    ref={el => inputRefs.current[i] = el}
                    type="number" inputMode="numeric" value={v ?? ''}
                    onChange={e => onChange(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); focusNext(i); } }}
                    onFocus={focusedHandlers?.onFocus}
                    onBlur={focusedHandlers?.onBlur}
                    style={{
                      ...styles.scoreInput,
                      border: unusual ? '1.5px solid #b85c3a' : '1px solid transparent',
                    }}
                    placeholder="–"
                  />
                  {gotSkin && (
                    <div style={{ position: 'absolute', top: 1, right: 2, fontSize: 8, color: '#b85c3a', fontWeight: 800, lineHeight: 1 }}>★</div>
                  )}
                  {unusual && (
                    <div style={{ position: 'absolute', bottom: 0, left: 2, fontSize: 8, color: '#b85c3a', fontWeight: 800, lineHeight: 1 }}>!</div>
                  )}
                </td>
              );
            })}
            <td style={{ ...styles.cardTd, background: '#f3ead4', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e' }}>
              {holes.reduce((s, i) => s + (safeNum(playerScores[i]) || 0), 0) || '—'}
            </td>
          </tr>
          <tr>
            <th style={{ ...styles.cardTh, color: '#7a8c5c', fontWeight: 500, fontSize: 10 }}>Net</th>
            {holes.map(i => {
              const v = safeNum(playerScores[i]);
              const net = v != null ? v - strokesOnHole(displayedCH, course.sis[i]) : null;
              return <td key={i} style={{ ...styles.cardTd, color: '#7a8c5c', fontSize: 10 }}>{net ?? ''}</td>;
            })}
            <td style={{ ...styles.cardTd, background: '#f3ead4', color: '#7a8c5c', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 11 }}>
              {(() => {
                const tot = holes.reduce((s, i) => {
                  const v = safeNum(playerScores[i]);
                  return v != null ? s + v - strokesOnHole(displayedCH, course.sis[i]) : s;
                }, 0);
                return tot || '—';
              })()}
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ padding: '8px 12px', fontSize: 10, color: '#8a9a7a', borderTop: '1px solid #e8e1cc', fontFamily: 'Manrope, sans-serif' }}>
        <span style={{ color: '#b85c3a', fontWeight: 700 }}>•</span> = stroke vs {strokeContext === 'match' ? 'this match' : 'the field'} &nbsp;·&nbsp;
        <span style={{ color: '#b85c3a', fontWeight: 700 }}>★</span> = skin &nbsp;·&nbsp;
        <span style={{ color: '#b85c3a', fontWeight: 700 }}>!</span> = unusual score (check) &nbsp;·&nbsp;
        Enter advances
      </div>
    </div>
  );
}

function MatchPlayPanel({ round, meta, rScores, settings, editing, setEditing, onUpdateMatchups, asFinalProjection }) {
  const course = effectiveCourse(round, meta.courses);
  const [draft, setDraft] = useState(round.matches || []);
  useEffect(() => { setDraft(round.matches || []); }, [round.id]);

  const lockInFinalists = () => {
    if (!asFinalProjection?.finalists || asFinalProjection.finalists.length < 2) return;
    const matchup = [{ a: asFinalProjection.finalists[0].id, b: asFinalProjection.finalists[1].id }];
    onUpdateMatchups(matchup);
  };

  if (editing) {
    return (
      <div style={styles.card}>
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: '#7a8c5c', marginBottom: 10 }}>
            {round.antiShtick === 'final'
              ? 'Set the two finalists. Tap "Lock in from standings" to auto-fill.'
              : 'One match = two teams head-to-head. Most rounds have two matches in parallel.'}
          </div>
          {draft.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select value={m.a} onChange={e => { const d = [...draft]; d[idx] = { ...d[idx], a: e.target.value }; setDraft(d); }} style={styles.select}>
                {meta.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <span style={{ fontSize: 11, color: '#7a8c5c' }}>vs</span>
              <select value={m.b} onChange={e => { const d = [...draft]; d[idx] = { ...d[idx], b: e.target.value }; setDraft(d); }} style={styles.select}>
                {meta.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={() => setDraft(draft.filter((_, i) => i !== idx))} style={styles.smallBtn}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <button onClick={() => setDraft([...draft, { a: meta.teams[0].id, b: meta.teams[1].id }])} style={styles.smallBtn}>+ Add Match</button>
            {round.antiShtick === 'final' && (
              <button onClick={() => {
                if (asFinalProjection?.finalists?.length >= 2) {
                  setDraft([{ a: asFinalProjection.finalists[0].id, b: asFinalProjection.finalists[1].id }]);
                }
              }} style={styles.smallBtn}>Lock in from standings</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => { onUpdateMatchups(draft); setEditing(false); }} style={styles.primaryBtn}>Save Matchups</button>
            <button onClick={() => { setDraft(round.matches || []); setEditing(false); }} style={styles.secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={{ padding: 14 }}>
        {(round.matches || []).map((m, idx) => {
          const result = computeMatch(m, rScores, meta.players, meta.teams, course, settings);
          if (!result) return null;
          return (
            <div key={idx} style={{ marginBottom: idx < round.matches.length - 1 ? 14 : 0, paddingBottom: idx < round.matches.length - 1 ? 14 : 0, borderBottom: idx < round.matches.length - 1 ? '1px solid #e8e1cc' : 'none' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: '#1a3a2e', fontWeight: 600 }}>
                {result.teamA.name} <span style={{ color: '#a5b095', fontStyle: 'italic', fontWeight: 400, margin: '0 6px' }}>vs</span> {result.teamB.name}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: result.points ? '#b85c3a' : '#1a3a2e', marginTop: 4 }}>
                {result.status}
              </div>
              <div style={{ fontSize: 10, color: '#8a9a7a', marginTop: 2 }}>
                Reference: {result.refPlayer.name} ({result.refPlayer.hcp.toFixed(1)}) plays scratch · {result.played}/18 played · {result.halved} halved
                {settings.handicapAllowance !== 1.0 && <span> · {Math.round(settings.handicapAllowance * 100)}% allowance</span>}
              </div>
            </div>
          );
        })}
        {(round.matches || []).length === 0 && (
          <div style={{ fontSize: 12, color: '#7a8c5c' }}>
            {round.antiShtick === 'final'
              ? `Projected finalists: ${asFinalProjection?.finalists?.map(f => f.name).join(' vs ') || '—'}. Tap Lock In below to set.`
              : 'No matches configured. Tap edit to add.'}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setEditing(true)} style={styles.secondaryBtn}>
            <Edit3 size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Edit Matchups
          </button>
          {round.antiShtick === 'final' && (round.matches || []).length === 0 && asFinalProjection?.finalists?.length >= 2 && (
            <button onClick={lockInFinalists} style={styles.primaryBtn}>
              <Lock size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Lock in Finalists
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// PLAYERS VIEW (editable)
// =====================================================================
function PlayersView({ meta, settings, onUpdatePlayer, onAddPlayer, onRemovePlayer, onUpdateTeams }) {
  const ref = lowestHcpPlayer(meta.players);
  const [editTeams, setEditTeams] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);

  return (
    <div style={styles.scrollBody}>
      <SectionTitle icon={Users} eyebrow="Handicaps · Nearest 0.5" title="Players" subtitle="Edit indices · add or remove players · adjust pairings" />

      <div style={styles.card}>
        {meta.players.map((p, i) => (
          <PlayerRow
            key={p.id} player={p} isRef={p.id === ref.id} isLast={i === meta.players.length - 1} courses={meta.courses}
            settings={settings} refHcp={ref.hcp}
            onUpdate={(patch) => onUpdatePlayer(p.id, patch)}
            onRemove={() => {
              if (!confirm(`Remove ${p.name}? This won't clear past scores from storage but the player won't appear in leaderboards.`)) return;
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
            <div key={t.id} style={{ padding: '12px 14px', borderBottom: i < meta.teams.length - 1 ? '1px solid #e8e1cc' : 'none' }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, color: '#1a3a2e' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>
                {t.playerIds.map(pid => meta.players.find(p => p.id === pid)?.name).filter(Boolean).join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 14, background: '#f3ead4', borderRadius: 8, fontSize: 12, color: '#5a6a4a', lineHeight: 1.5 }}>
        <div><strong style={{ color: '#1a3a2e' }}>Course Handicap:</strong> <em>round(Index × Slope ÷ 113 + Course Rating − Par)</em></div>
        <div style={{ marginTop: 6 }}>Each course row shows raw <strong>Course Hcp</strong> with <span style={{ color: '#b85c3a' }}>(strokes vs field's low)</span>.</div>
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
    <div style={{ padding: '14px 14px', borderBottom: isLast ? 'none' : '1px solid #e8e1cc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            type="text" value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { if (name.trim() && name !== player.name) onUpdate({ name: name.trim() }); else setName(player.name); }}
            style={styles.nameInput}
          />
          {isRef && <span style={{ fontSize: 9, color: '#b85c3a', fontWeight: 700, marginLeft: 6, letterSpacing: '0.1em' }}>FIELD LOW</span>}
          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {Object.values(courses).map(c => {
              const ch = courseHandicap(player.hcp, c);
              const adj = adjustedCH(player.hcp, refHcp, c, 1.0);
              return (
                <div key={c.name} style={{ fontSize: 9.5, color: '#7a8c5c' }}>
                  <span style={{ letterSpacing: '0.04em' }}>{c.name.toUpperCase()}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#1a3a2e', marginLeft: 4 }}>{ch}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#b85c3a', marginLeft: 3 }}>({adj})</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number" step="0.5" value={hcp}
            onChange={e => setHcp(e.target.value)}
            onBlur={() => {
              const rounded = roundToHalf(hcp);
              setHcp(String(rounded));
              if (rounded !== player.hcp) onUpdate({ hcp: rounded });
            }}
            style={styles.hcpInput}
          />
          <button onClick={onRemove} style={styles.iconDangerBtn} title="Remove player">
            <Trash2 size={13} />
          </button>
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
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: '#1a3a2e' }}>Add Player</div>
          <button onClick={onCancel} style={styles.iconBtn}><X size={18} /></button>
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
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 20, color: '#1a3a2e' }}>Edit Teams</div>
          <button onClick={onCancel} style={styles.iconBtn}><X size={18} /></button>
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
// SETTINGS VIEW
// =====================================================================
function SettingsView({ meta, settings, scores, onUpdateCourse, onUpdateSettings, onReset, onExport }) {
  const [openCourseId, setOpenCourseId] = useState(null);
  return (
    <div style={styles.scrollBody}>
      <SectionTitle icon={Settings} eyebrow="Tournament" title="Rules" subtitle="Per-tournament options. Changes apply immediately." />
      <div style={styles.card}>
        <div style={{ padding: '14px 14px', borderBottom: '1px solid #e8e1cc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 15, color: '#1a3a2e' }}>Anti-Shtick Handicap Allowance</div>
              <div style={{ fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>USGA recommends 85% for four-ball. 100% = full strokes.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10, background: '#f0ead7', padding: 3, borderRadius: 6 }}>
            {[{ v: 0.85, l: '85%' }, { v: 0.9, l: '90%' }, { v: 1.0, l: '100%' }].map(opt => (
              <button key={opt.v} onClick={() => onUpdateSettings({ handicapAllowance: opt.v })} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: 4,
                background: Math.abs(settings.handicapAllowance - opt.v) < 0.001 ? '#fbf7ec' : 'transparent',
                color: '#1a3a2e', fontWeight: Math.abs(settings.handicapAllowance - opt.v) < 0.001 ? 700 : 500,
                fontSize: 12, cursor: 'pointer',
                boxShadow: Math.abs(settings.handicapAllowance - opt.v) < 0.001 ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}>{opt.l}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 15, color: '#1a3a2e' }}>Skins Carryover</div>
              <div style={{ fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>Tied holes carry to the next hole (standard skins rule)</div>
            </div>
            <Toggle value={settings.skinsCarryover} onChange={v => onUpdateSettings({ skinsCarryover: v })} />
          </div>
        </div>
      </div>

      <SectionTitle icon={MapPin} eyebrow="Courses" title="Course Setup" subtitle="Verify against actual scorecards before the trip" style={{ marginTop: 28 }} />
      <div style={{ padding: '10px 14px', background: '#f5e0d0', borderRadius: 8, marginBottom: 12, fontSize: 11, color: '#9c4a28', border: '1px solid #e8c5b5' }}>
        <strong>Pars & stroke indices:</strong> Verified against official Bandon scorecards. <strong>Tees per round</strong> (rating/slope auto-set): R1 Trails / R2 Sheep / R3 Dunes / R4 Old Mac = <strong>Gold</strong>; R5 Dunes (AS Final) and R6 Trails (HH Championship) = <strong>Green</strong>. Change tees from each round's detail view (tap a round below).
      </div>
      <div style={styles.card}>
        {Object.entries(meta.courses).map(([id, c], i, arr) => (
          <div key={id} style={{ borderBottom: i < arr.length - 1 ? '1px solid #e8e1cc' : 'none' }}>
            <button onClick={() => setOpenCourseId(openCourseId === id ? null : id)} style={{
              width: '100%', textAlign: 'left', padding: '14px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, color: '#1a3a2e' }}>{c.name}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#7a8c5c', marginTop: 2 }}>Par {c.par} · {c.rating}/{c.slope}</div>
              </div>
              <ChevronRight size={18} color="#7a8c5c" style={{ transform: openCourseId === id ? 'rotate(90deg)' : 'none' }} />
            </button>
            {openCourseId === id && (
              <div style={{ padding: '0 14px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <LabeledInput label="Par" value={c.par} onChange={v => onUpdateCourse(id, { par: Number(v) })} />
                  <LabeledInput label="Rating" value={c.rating} step="0.1" onChange={v => onUpdateCourse(id, { rating: Number(v) })} />
                  <LabeledInput label="Slope" value={c.slope} onChange={v => onUpdateCourse(id, { slope: Number(v) })} />
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7a8c5c', fontWeight: 700, marginBottom: 6 }}>Hole-by-hole</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.cardTable}>
                    <thead><tr><th style={styles.cardTh}>H</th>{Array.from({ length: 18 }, (_, i) => <th key={i} style={styles.cardTh}>{i + 1}</th>)}</tr></thead>
                    <tbody>
                      <tr><th style={{ ...styles.cardTh, fontSize: 9, color: '#7a8c5c', fontWeight: 600 }}>Par</th>
                        {c.pars.map((p, i) => (
                          <td key={i} style={{ ...styles.cardTd, padding: 1 }}>
                            <input type="number" value={p} onChange={e => { const nv = [...c.pars]; nv[i] = Number(e.target.value); onUpdateCourse(id, { pars: nv }); }} style={styles.miniInput} />
                          </td>
                        ))}</tr>
                      <tr><th style={{ ...styles.cardTh, fontSize: 9, color: '#7a8c5c', fontWeight: 600 }}>SI</th>
                        {c.sis.map((s, i) => (
                          <td key={i} style={{ ...styles.cardTd, padding: 1 }}>
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

      <SectionTitle icon={Download} eyebrow="Export" title="Save your data" subtitle="All scores in a CSV you can keep" style={{ marginTop: 28 }} />
      <button onClick={onExport} style={{ ...styles.secondaryBtn, width: '100%' }}>
        <Download size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Download CSV
      </button>

      <SectionTitle icon={AlertCircle} eyebrow="Reset" title="Danger Zone" style={{ marginTop: 28 }} />
      <button onClick={onReset} style={styles.dangerBtn}>Reset everything to defaults</button>

      <div style={{ marginTop: 24, padding: 14, background: '#f3ead4', borderRadius: 8, fontSize: 11, color: '#5a6a4a', lineHeight: 1.6 }}>
        <strong style={{ color: '#1a3a2e', fontFamily: 'Fraunces, serif' }}>How sync works:</strong> Each round's scores are stored separately so two people entering scores for different rounds can't clobber each other. Same-round concurrent edits use a read-merge-write to minimize collisions. App polls for updates every 25 seconds (skipped while you're typing).
      </div>
      <div style={{ height: 80 }} />
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 26, borderRadius: 13, border: 'none', position: 'relative',
      background: value ? '#1a3a2e' : '#d5cdb5', cursor: 'pointer', transition: 'background 0.15s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20,
        borderRadius: 10, background: '#fbf7ec', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
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

// =====================================================================
// STYLES
// =====================================================================
const styles = {
  appShell: {
    minHeight: '100vh', background: '#fbf7ec',
    fontFamily: 'Manrope, system-ui, sans-serif', color: '#1a3a2e',
    paddingBottom: 80,
    backgroundImage: `
      radial-gradient(circle at 20% 0%, rgba(58, 90, 64, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 80% 100%, rgba(184, 92, 58, 0.04) 0%, transparent 50%)
    `,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 16px 12px', borderBottom: '1px solid #ebe3cc', gap: 12 },
  scrollBody: { padding: '18px 14px 24px' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fbf7ec', border: '1px solid #e8e1cc', borderRadius: 8, boxShadow: '0 1px 0 rgba(0,0,0,0.02)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'Manrope, sans-serif' },
  th: { padding: '10px 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a8c5c', textAlign: 'center', borderBottom: '1px solid #e8e1cc', background: '#f5efde' },
  tr: { background: '#fbf7ec' },
  trAlt: { background: '#f8f1da' },
  td: { padding: '10px 6px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid #ebe3cc' },
  roundChip: { background: '#fbf7ec', border: '1px solid #e8e1cc', borderRadius: 8, padding: '14px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', boxShadow: '0 1px 0 rgba(0,0,0,0.02)', width: '100%' },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(251, 247, 236, 0.96)', borderTop: '1px solid #e8e1cc', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0 14px', backdropFilter: 'blur(8px)', zIndex: 10 },
  navBtn: { background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '4px 14px', fontFamily: 'Manrope, sans-serif' },
  iconBtn: { background: '#f3ead4', border: '1px solid #e8e1cc', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  iconDangerBtn: { background: 'transparent', border: '1px solid #e8c5b5', borderRadius: 6, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#b85c3a' },
  refreshBtn: { background: '#f3ead4', border: '1px solid #e8e1cc', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#1a3a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playerTab: { borderStyle: 'solid', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', minWidth: 70, textAlign: 'center', fontFamily: 'Manrope, sans-serif' },
  cardTable: { width: '100%', borderCollapse: 'collapse' },
  cardTh: { padding: '6px 2px', fontSize: 10, fontWeight: 700, color: '#7a8c5c', textAlign: 'center', borderBottom: '1px solid #e8e1cc', background: '#f5efde', minWidth: 30 },
  cardTd: { padding: '4px 2px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid #ebe3cc', minWidth: 30 },
  scoreInput: { width: 36, height: 32, padding: 0, background: 'transparent', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#1a3a2e', borderRadius: 4, outline: 'none' },
  miniInput: { width: 30, height: 26, padding: 0, border: '1px solid #e8e1cc', borderRadius: 3, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, background: '#fbf7ec', color: '#1a3a2e' },
  hcpInput: { width: 70, padding: '8px 6px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#1a3a2e', border: '1px solid #e8e1cc', borderRadius: 6, background: '#fbf7ec' },
  nameInput: { fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, color: '#1a3a2e', background: 'transparent', border: 'none', borderBottom: '1px dashed transparent', padding: '2px 0', outline: 'none', width: '80%' },
  input: { width: '100%', padding: '8px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, border: '1px solid #e8e1cc', borderRadius: 6, background: '#fbf7ec', color: '#1a3a2e' },
  label: { fontSize: 10, color: '#7a8c5c', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 },
  select: { padding: '6px 8px', fontFamily: 'Manrope, sans-serif', fontSize: 12, border: '1px solid #e8e1cc', borderRadius: 6, background: '#fbf7ec', color: '#1a3a2e' },
  primaryBtn: { background: '#1a3a2e', color: '#fbf7ec', border: 'none', borderRadius: 6, padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em' },
  secondaryBtn: { background: '#f3ead4', color: '#1a3a2e', border: '1px solid #e8e1cc', borderRadius: 6, padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em' },
  smallBtn: { background: '#f3ead4', color: '#1a3a2e', border: '1px solid #e8e1cc', borderRadius: 4, padding: '6px 10px', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 11, cursor: 'pointer' },
  dangerBtn: { width: '100%', background: '#fbf7ec', color: '#b85c3a', border: '1px solid #e8c5b5', borderRadius: 6, padding: '12px 14px', fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em' },
  championBanner: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'linear-gradient(135deg, #f6ead0 0%, #f3ead4 100%)', border: '1px solid #e6d5a8', borderRadius: 8, boxShadow: '0 1px 0 rgba(184, 92, 58, 0.08)' },
  mePill: { display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f3ead4', border: '1px solid #e8e1cc', borderRadius: 12, padding: '4px 10px', fontSize: 11, color: '#1a3a2e', fontWeight: 600, cursor: 'pointer', marginTop: 6, fontFamily: 'Manrope, sans-serif' },
  meChoice: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#fbf7ec', border: '1px solid #e8e1cc', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', textAlign: 'left' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 58, 46, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100, backdropFilter: 'blur(2px)' },
  modal: { background: '#fbf7ec', border: '1px solid #e8e1cc', borderRadius: 12, padding: 20, maxWidth: 420, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' },
};
