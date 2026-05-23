// src/lib.js
// Constants, defaults, and all scoring/math computation.

// ---- Schema version ----
// Bumping triggers a migration on app load: courses + round metadata
// get refreshed from defaults while preserving player edits and matchups
// (except R5, which is cleared on this bump since AS structure changed).
export const SCHEMA_VERSION = 3;

// ---- Scoring rules ----
export const MAX_OVER_PAR = 4; // cap any hole score at par + 4

// ---- Default rosters / teams / tournament structure ----
export const DEFAULT_PLAYERS = [
  { id: 'charlie', name: 'Charlie Bogart',     hcp: 12.0 },
  { id: 'alex',    name: 'Alex Lichtenberg',   hcp: 7.0  },
  { id: 'elijah',  name: 'Elijah Lichtenberg', hcp: 10.5 },
  { id: 'jmiller', name: 'Josh Miller',        hcp: 18.5 },
  { id: 'jtohl',   name: 'Josh Tohl',          hcp: 23.0 },
  { id: 'corey',   name: 'Corey Argumosa',     hcp: 13.5 },
  { id: 'ian',     name: 'Ian Finley',         hcp: 23.0 },
  { id: 'ryan',    name: 'Ryan Pleuger',       hcp: 11.0 },
];

export const DEFAULT_TEAMS = [
  { id: 't1', name: 'Charlie & Alex', playerIds: ['charlie', 'alex'] },
  { id: 't2', name: 'Elijah & Corey', playerIds: ['elijah', 'corey'] },
  { id: 't3', name: 'Josh & Josh',    playerIds: ['jmiller', 'jtohl'] },
  { id: 't4', name: 'Ryan & Ian',     playerIds: ['ryan', 'ian'] },
];

export const DEFAULT_COURSES = {
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

export const TEE_OPTIONS = {
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

// Round structure. Each round either has explicit foursomes (R1) or matches
// that imply foursomes (R2–R5), or has foursomes that are computed at runtime
// based on standings (R6 = top 4 / bottom 4 by HH qualifier).
export const DEFAULT_ROUNDS = [
  { id: 'r1', n: 1, date: 'Fri • Aug 28', courseId: 'trails', teeTime: '11:20 / 11:40 AM', tees: 'Gold',
    hitAHouse: 'qualifier', antiShtick: null, antiShtickLabel: null, matches: [],
    foursomes: [
      { teeTime: '11:20 AM', playerIds: ['charlie', 'alex', 'elijah', 'corey'] },
      { teeTime: '11:40 AM', playerIds: ['jmiller', 'jtohl', 'ryan', 'ian'] },
    ] },
  { id: 'r2', n: 2, date: 'Sat • Aug 29', courseId: 'sheep',  teeTime: '8:00 / 8:10 AM', tees: 'Gold',
    hitAHouse: 'qualifier', antiShtick: 'regular', antiShtickLabel: 'Round 1',
    matches: [
      { a:'t1', b:'t2', teeTime: '8:00 AM' },
      { a:'t3', b:'t4', teeTime: '8:10 AM' },
    ] },
  { id: 'r3', n: 3, date: 'Sat • Aug 29', courseId: 'dunes',  teeTime: '1:10 / 1:20 PM', tees: 'Gold',
    hitAHouse: null, antiShtick: 'regular', antiShtickLabel: 'Round 2',
    matches: [
      { a:'t1', b:'t3', teeTime: '1:10 PM' },
      { a:'t2', b:'t4', teeTime: '1:20 PM' },
    ] },
  { id: 'r4', n: 4, date: 'Sun • Aug 30', courseId: 'oldmac', teeTime: '7:00 / 7:10 AM', tees: 'Gold',
    hitAHouse: 'qualifier', antiShtick: 'regular', antiShtickLabel: 'Round 3',
    matches: [
      { a:'t1', b:'t4', teeTime: '7:00 AM' },
      { a:'t2', b:'t3', teeTime: '7:10 AM' },
    ] },
  { id: 'r5', n: 5, date: 'Sun • Aug 30', courseId: 'dunes',  teeTime: '12:40 / 12:50 PM', tees: 'Green',
    hitAHouse: null, antiShtick: 'final', antiShtickLabel: 'Final Round', matches: [],
    foursomeTeeTimes: ['12:40 PM', '12:50 PM'] },
  { id: 'r6', n: 6, date: 'Mon • Aug 31', courseId: 'trails', teeTime: '9:30 / 9:40 AM', tees: 'Green',
    hitAHouse: 'championship', antiShtick: null, antiShtickLabel: null, matches: [],
    foursomeTeeTimes: ['9:30 AM', '9:40 AM'] },
];

export const DEFAULT_SETTINGS = {
  handicapAllowance: 1.0,
  skinsCarryover: false,
};

// =====================================================================
// MATH HELPERS
// =====================================================================
export function roundToHalf(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 2) / 2;
}

export function courseHandicap(hcpIndex, course) {
  if (!course || hcpIndex == null) return 0;
  // Round to nearest 0.5 (was: nearest integer). This lets us carry the
  // half-stroke granularity through every downstream calculation.
  const raw = hcpIndex * (course.slope / 113) + (course.rating - course.par);
  return Math.round(raw * 2) / 2;
}

// Returns a course with rating/slope adjusted for the round's tees.
export function effectiveCourse(round, courses) {
  const c = courses[round.courseId];
  if (!c) return null;
  const teeData = round?.tees ? TEE_OPTIONS[round.courseId]?.[round.tees] : null;
  return {
    ...c,
    rating: teeData?.rating ?? c.rating,
    slope:  teeData?.slope  ?? c.slope,
    tees:   round?.tees ?? null,
  };
}

export function applyAllowance(ch, allowance) {
  // Round to nearest 0.5 so half-strokes survive the allowance multiplication.
  return Math.round(ch * (allowance ?? 1.0) * 2) / 2;
}

export function strokesOnHole(ch, si) {
  if (!ch || ch <= 0) return 0;
  // Whole-stroke logic (unchanged): full strokes on the hardest holes,
  // wrapping for very high handicaps (>18, >36).
  const wholeCh = Math.floor(ch);
  const hasHalf = (ch - wholeCh) >= 0.5;
  let s = 0;
  if (si <= wholeCh)        s += 1;
  if (si <= wholeCh - 18)   s += 1;
  if (si <= wholeCh - 36)   s += 1;
  // Half-stroke: if the handicap has a 0.5 remainder, it goes on the next
  // hole after the whole strokes end — i.e. (wholeCh % 18) + 1.
  // Examples:
  //   ch=3.5 → halfSi=4   (half stroke on SI 4)
  //   ch=18.5 → halfSi=1  (every hole had 1 stroke; SI 1 now gets 1.5)
  //   ch=22.5 → halfSi=5  (SI 1–4 got 2 strokes; SI 5 now gets 1.5)
  if (hasHalf) {
    const halfSi = (wholeCh % 18) + 1;
    if (si === halfSi) s += 0.5;
  }
  return s;
}

export function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Cap a score at par + MAX_OVER_PAR.
export function capScore(raw, par) {
  const n = safeNum(raw);
  if (n == null) return null;
  if (!par) return n;
  return Math.min(n, par + MAX_OVER_PAR);
}

// Display helpers for half-stroke-aware values.
// Net totals and to-par figures can now end in .5 — these helpers print
// "72" for integers and "72.5" for halves, "+2"/"E"/"-1.5" for to-par.
export function fmtScore(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

export function fmtToPar(n) {
  if (n == null || !Number.isFinite(n)) return '';
  if (n === 0) return 'E';
  const abs = Number.isInteger(n) ? String(Math.abs(n)) : Math.abs(n).toFixed(1);
  return (n > 0 ? '+' : '-') + abs;
}

export function lowestHcpPlayer(players) {
  if (!players?.length) return null;
  return players.reduce((low, p) => (p.hcp < low.hcp ? p : low), players[0]);
}

// Strokes given relative to a reference player on this course (handicap diff after allowance).
export function adjustedCH(playerHcp, refHcp, course, allowance = 1.0) {
  const p = applyAllowance(courseHandicap(playerHcp, course), allowance);
  const r = applyAllowance(courseHandicap(refHcp, course), allowance);
  return Math.max(0, p - r);
}

// Gross/net for one player in one round, with score cap applied.
export function playerTotalsAdj(player, roundScores, course, refHcp, allowance) {
  const raw = (roundScores && roundScores[player.id]) || [];
  const aCH = adjustedCH(player.hcp, refHcp, course, allowance);
  let gross = 0, net = 0, played = 0;
  for (let i = 0; i < 18; i++) {
    const s = capScore(raw[i], course.pars[i]);
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
export function computeSkinsForRound(roundScores, players, course, settings) {
  const ref = lowestHcpPlayer(players);
  if (!ref) return { perHole: Array(18).fill({ winner: null, complete: false }), totals: {} };
  const allowance = 1.0;
  const perHole = [];
  let carry = 0;

  for (let h = 0; h < 18; h++) {
    const si = course.sis[h];
    const par = course.pars[h];
    const nets = players.map(p => {
      const gross = capScore((roundScores[p.id] || [])[h], par);
      if (gross == null) return null;
      const aCH = adjustedCH(p.hcp, ref.hcp, course, allowance);
      return { playerId: p.id, gross, net: gross - strokesOnHole(aCH, si) };
    });
    const valid = nets.filter(n => n != null);
    if (valid.length < players.length) {
      perHole.push({ winner: null, complete: false, carry });
      continue;
    }
    const minNet = Math.min(...valid.map(v => v.net));
    const winners = valid.filter(v => v.net === minNet);
    if (winners.length === 1) {
      const skin = 1 + carry;
      perHole.push({ winner: winners[0].playerId, net: minNet, complete: true, value: skin, carry: 0 });
      carry = 0;
    } else if (settings?.skinsCarryover) {
      carry += 1;
      perHole.push({ winner: null, complete: true, tied: true, carry });
    } else {
      perHole.push({ winner: null, complete: true, tied: true, carry: 0 });
    }
  }

  const totals = {};
  players.forEach(p => totals[p.id] = 0);
  perHole.forEach(h => { if (h.winner) totals[h.winner] += (h.value || 1); });
  return { perHole, totals };
}

export function computeSkinsOverall(meta, scores, settings) {
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
// MATCH PLAY  (hole-by-hole)
// =====================================================================
// Returns per-hole winner and team hole counts.
// Halved holes credit 0.5 to each team.
export function computeMatch(match, roundScores, players, teams, course, settings) {
  const tA = teams.find(t => t.id === match.a);
  const tB = teams.find(t => t.id === match.b);
  if (!tA || !tB) return null;
  const pA = tA.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);
  const pB = tB.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);
  const four = [...pA, ...pB];
  if (!four.length) return null;
  const ref = lowestHcpPlayer(four);
  const allowance = settings?.handicapAllowance ?? 1.0;

  const chMap = {};
  four.forEach(p => { chMap[p.id] = adjustedCH(p.hcp, ref.hcp, course, allowance); });

  const perHole = [];
  let aHolesWon = 0, bHolesWon = 0, halved = 0, played = 0;

  for (let h = 0; h < 18; h++) {
    const si = course.sis[h];
    const par = course.pars[h];
    const netsOf = (pls) => pls.map(p => {
      const g = capScore((roundScores[p.id] || [])[h], par);
      if (g == null) return null;
      return g - strokesOnHole(chMap[p.id], si);
    });
    const aNets = netsOf(pA);
    const bNets = netsOf(pB);
    if (aNets.some(n => n == null) || bNets.some(n => n == null)) {
      perHole.push({ winner: null, complete: false });
      continue;
    }
    const a = Math.min(...aNets);
    const b = Math.min(...bNets);
    played++;
    if (a < b)       { aHolesWon++; perHole.push({ winner: 'a', complete: true, aNet: a, bNet: b }); }
    else if (b < a)  { bHolesWon++; perHole.push({ winner: 'b', complete: true, aNet: a, bNet: b }); }
    else             { halved++;    perHole.push({ winner: 'halved', complete: true, aNet: a, bNet: b }); }
  }

  // Team "points" from this match = holes won + 0.5 per halved hole
  const aPoints = aHolesWon + halved * 0.5;
  const bPoints = bHolesWon + halved * 0.5;

  let status;
  if (played === 0) status = 'Not started';
  else if (played === 18) {
    if (aHolesWon === bHolesWon) status = `Halved · ${aHolesWon}-${bHolesWon} (${halved} AS)`;
    else status = `${aHolesWon > bHolesWon ? tA.name : tB.name} ${aHolesWon}-${bHolesWon}${halved ? ` (${halved} AS)` : ''}`;
  } else {
    status = `Thru ${played} · ${aHolesWon}-${bHolesWon}${halved ? ` (${halved} AS)` : ''}`;
  }

  return {
    teamA: tA, teamB: tB, refPlayer: ref, chMap, perHole,
    aHolesWon, bHolesWon, halved, played,
    aPoints, bPoints, // 0.5 per halved + 1 per win
    status,
  };
}

// =====================================================================
// ANTI-SHTICK  (hole-by-hole scoring across all AS rounds)
// =====================================================================
// Standings = total holes won (with halves counted as 0.5) summed across
// every match in every AS round.  R5 contributes too — bottom-2 teams can
// still win overall by piling up wins in their consolation final.
export function computeAntiShtickStandings(meta, scores, settings, opts = {}) {
  const excludeRounds = new Set(opts.excludeRounds || []);
  const standings = {};
  meta.teams.forEach(t => {
    standings[t.id] = {
      team: t,
      holesWon: 0,         // total (counts halves as 0.5)
      holesWonRaw: 0,      // outright wins only
      halvedTotal: 0,
      holesLost: 0,
      byRound: {},         // { roundId: { won, lost, halved, oppName, role } }
      matchesPlayed: 0,
    };
  });

  meta.rounds.filter(r => r.antiShtick).forEach(round => {
    if (excludeRounds.has(round.id)) return;
    const course = effectiveCourse(round, meta.courses);
    (round.matches || []).forEach(m => {
      const result = computeMatch(m, scores[round.id] || {}, meta.players, meta.teams, course, settings);
      if (!result) return;
      const sa = standings[m.a]; const sb = standings[m.b];
      if (!sa || !sb) return;

      sa.holesWon    += result.aPoints;
      sb.holesWon    += result.bPoints;
      sa.holesWonRaw += result.aHolesWon;
      sb.holesWonRaw += result.bHolesWon;
      sa.holesLost   += result.bHolesWon;
      sb.holesLost   += result.aHolesWon;
      sa.halvedTotal += result.halved;
      sb.halvedTotal += result.halved;

      sa.byRound[round.id] = { won: result.aPoints, lost: result.bPoints, halved: result.halved, oppId: m.b, oppName: result.teamB.name, played: result.played };
      sb.byRound[round.id] = { won: result.bPoints, lost: result.aPoints, halved: result.halved, oppId: m.a, oppName: result.teamA.name, played: result.played };

      if (result.played > 0) { sa.matchesPlayed += 1; sb.matchesPlayed += 1; }
    });
  });

  return Object.values(standings).sort((a, b) => {
    if (a.holesWon !== b.holesWon) return b.holesWon - a.holesWon;
    // tiebreakers: more outright wins, fewer losses, alpha by team name
    if (a.holesWonRaw !== b.holesWonRaw) return b.holesWonRaw - a.holesWonRaw;
    if (a.holesLost !== b.holesLost) return a.holesLost - b.holesLost;
    return a.team.name.localeCompare(b.team.name);
  });
}

// Given current standings excluding R5, project who plays whom in R5.
export function projectR5Matchups(meta, scores, settings) {
  const standings = computeAntiShtickStandings(meta, scores, settings, { excludeRounds: ['r5'] });
  if (standings.length < 4) return null;
  const anyPlayed = standings.some(s => s.matchesPlayed > 0);
  if (!anyPlayed) return null;
  const r5 = meta.rounds.find(r => r.id === 'r5');
  const tt = r5?.foursomeTeeTimes || ['12:40 PM', '12:50 PM'];
  return {
    championship: { a: standings[0].team.id, b: standings[1].team.id, role: 'championship', teeTime: tt[0] },
    consolation:  { a: standings[2].team.id, b: standings[3].team.id, role: 'consolation',  teeTime: tt[1] },
    seedOrder: standings.map(s => s.team.id),
  };
}

// Has R5 been locked in yet?
export function isR5Locked(meta) {
  const r5 = meta.rounds.find(r => r.id === 'r5');
  return !!(r5?.matches && r5.matches.length >= 2);
}

// Resolves the foursomes for any round in a single uniform structure.
// Each foursome: { teeTime, playerIds, matchLabel?, teamAId?, teamBId?, provisional? }
export function getRoundFoursomes(round, meta, scores, settings) {
  // R1 (and any round with hard-coded foursomes)
  if (round.foursomes?.length) return round.foursomes;

  // AS rounds with locked-in matches → derive foursomes from matches
  if (round.matches?.length) {
    return round.matches.map((m, i) => {
      const tA = meta.teams.find(t => t.id === m.a);
      const tB = meta.teams.find(t => t.id === m.b);
      if (!tA || !tB) return null;
      let matchLabel = `${tA.name} vs ${tB.name}`;
      if (round.id === 'r5') {
        matchLabel = i === 0 ? `🏆 Championship · ${tA.name} vs ${tB.name}` : `Consolation · ${tA.name} vs ${tB.name}`;
      }
      return {
        teeTime: m.teeTime,
        playerIds: [...tA.playerIds, ...tB.playerIds],
        matchLabel,
        teamAId: m.a,
        teamBId: m.b,
      };
    }).filter(Boolean);
  }

  // R5 not yet locked → projected from current standings
  if (round.id === 'r5') {
    const proj = projectR5Matchups(meta, scores, settings);
    if (!proj) return [];
    const tt = round.foursomeTeeTimes || ['12:40 PM', '12:50 PM'];
    const tA = meta.teams.find(t => t.id === proj.championship.a);
    const tB = meta.teams.find(t => t.id === proj.championship.b);
    const tC = meta.teams.find(t => t.id === proj.consolation.a);
    const tD = meta.teams.find(t => t.id === proj.consolation.b);
    return [
      {
        teeTime: tt[0],
        playerIds: [...tA.playerIds, ...tB.playerIds],
        matchLabel: `🏆 Championship · ${tA.name} vs ${tB.name}`,
        teamAId: proj.championship.a, teamBId: proj.championship.b,
        provisional: true,
      },
      {
        teeTime: tt[1],
        playerIds: [...tC.playerIds, ...tD.playerIds],
        matchLabel: `Consolation · ${tC.name} vs ${tD.name}`,
        teamAId: proj.consolation.a, teamBId: proj.consolation.b,
        provisional: true,
      },
    ];
  }

  // R6 HH Championship → top 4 / bottom 4 from qualifier standings
  if (round.id === 'r6') {
    const q = computeHitAHouseQualifier(meta, scores, settings);
    if (!q.length) return [];
    const top4 = q.slice(0, 4).filter(r => r.player).map(r => r.player.id);
    const bot4 = q.slice(4, 8).filter(r => r.player).map(r => r.player.id);
    if (top4.length < 4 || bot4.length < 4) return [];
    const tt = round.foursomeTeeTimes || ['9:30 AM', '9:40 AM'];
    const provisional = !qualifierComplete(meta, scores);
    return [
      {
        teeTime: tt[0],
        playerIds: bot4,
        matchLabel: 'Seeds 5–8',
        provisional,
      },
      {
        teeTime: tt[1],
        playerIds: top4,
        matchLabel: '🏆 Championship · Top 4',
        provisional,
      },
    ];
  }

  return [];
}

// Are regular AS rounds complete? (any played counts toward "have prelims started";
// "fully played" means all 18 holes by all participating players)
export function regularPhaseComplete(meta, scores) {
  const regulars = meta.rounds.filter(r => r.antiShtick === 'regular');
  return regulars.every(r => {
    const rs = scores[r.id] || {};
    // need all 8 players to have 18 holes complete
    return meta.players.every(p => {
      const arr = rs[p.id] || [];
      let count = 0;
      for (let i = 0; i < 18; i++) if (safeNum(arr[i]) != null) count++;
      return count === 18;
    });
  });
}

// =====================================================================
// HIT-A-HOUSE
// =====================================================================
export function computeHitAHouseQualifier(meta, scores, settings) {
  const ref = lowestHcpPlayer(meta.players);
  const allowance = 1.0;
  const qRounds = meta.rounds.filter(r => r.hitAHouse === 'qualifier');
  const totalQ = qRounds.length;

  const rows = meta.players.map(player => {
    const rounds = qRounds.map(r => {
      const course = effectiveCourse(r, meta.courses);
      const t = playerTotalsAdj(player, scores[r.id] || {}, course, ref.hcp, allowance);
      const parThru = course.pars.slice(0, t.played).reduce((s, p) => s + p, 0);
      const netToPar = t.played > 0 ? t.net - parThru : null;
      return { roundId: r.id, courseName: course.name, ...t, netToPar, complete: t.played === 18 };
    });
    const totalNet = rounds.reduce((s, r) => s + (r.net || 0), 0);
    const totalGross = rounds.reduce((s, r) => s + (r.gross || 0), 0);
    const bestSingleNet = rounds.reduce((b, r) => (r.played > 0 && (b == null || r.net < b)) ? r.net : b, null);
    const completedRounds = rounds.filter(r => r.complete).length;
    const anyPlayed = rounds.some(r => r.played > 0);
    return { player, rounds, totalNet, totalGross, bestSingleNet, completedRounds, totalQ, anyPlayed };
  });

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

export function computeHitAHouseChampionship(meta, scores, settings) {
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
    if (a.gross !== b.gross) return a.gross - b.gross;
    return a.qualifierTotal - b.qualifierTotal;
  });
  return { qualifier, qualifiedIds, allQualifiersComplete, cRound, course, results };
}

// Has the HH qualifier fully wrapped?
export function qualifierComplete(meta, scores) {
  const qRounds = meta.rounds.filter(r => r.hitAHouse === 'qualifier');
  return qRounds.every(r => {
    const rs = scores[r.id] || {};
    return meta.players.every(p => {
      const arr = rs[p.id] || [];
      let count = 0;
      for (let i = 0; i < 18; i++) if (safeNum(arr[i]) != null) count++;
      return count === 18;
    });
  });
}

// =====================================================================
// MIGRATION
// =====================================================================
export async function migrateMetaIfNeeded(meta, persistMetaFn) {
  if (!meta) return meta;
  const storedVersion = meta._schemaVersion || 1;
  if (storedVersion >= SCHEMA_VERSION) return meta;
  // v2 → v3 changed AS scoring to per-hole and made R5 hold 2 matches.
  // Refresh courses + round metadata; preserve user matchups EXCEPT R5
  // (where the structure changed and re-lock is required).
  const userMatchups = {};
  (meta.rounds || []).forEach(r => {
    if (r.matches && r.id !== 'r5') userMatchups[r.id] = r.matches;
  });
  const migrated = {
    ...meta,
    courses: DEFAULT_COURSES,
    rounds: DEFAULT_ROUNDS.map(r => ({
      ...r,
      matches: userMatchups[r.id] ?? r.matches ?? [],
    })),
    _schemaVersion: SCHEMA_VERSION,
  };
  await persistMetaFn(migrated);
  return migrated;
}

// =====================================================================
// CSV EXPORT
// =====================================================================
export function buildCSV(meta, scores) {
  const rows = [];
  rows.push(['Round', 'Course', 'Tees', 'Date', 'Player', 'HCP', ...Array.from({ length: 18 }, (_, i) => `H${i + 1}`), 'Gross']);
  meta.rounds.forEach(r => {
    const course = effectiveCourse(r, meta.courses);
    meta.players.forEach(p => {
      const playerScores = (scores[r.id] || {})[p.id] || Array(18).fill(null);
      const capped = playerScores.map((v, i) => capScore(v, course.pars[i]));
      const gross = capped.reduce((s, v) => s + (v || 0), 0);
      rows.push([
        `R${r.n}`, course.name, r.tees || '', r.date, p.name, p.hcp.toFixed(1),
        ...capped.map(v => v ?? ''),
        gross || '',
      ]);
    });
  });
  return rows.map(row => row.map(cell => {
    const s = String(cell);
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
}

export function downloadCSV(meta, scores) {
  const csv = buildCSV(meta, scores);
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
