// src/App.jsx
// Main app component. Holds Firestore state, real-time subscriptions, and
// routes between views.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

import {
  loadAll, subscribeAll,
  persistScoreCell, persistClearRound, persistMeta, persistSettings, persistMe,
  loadFoursomes, saveFoursome, isFirebaseConfigured,
} from './storage.js';

import {
  DEFAULT_PLAYERS, DEFAULT_TEAMS, DEFAULT_COURSES, DEFAULT_ROUNDS, DEFAULT_SETTINGS,
  SCHEMA_VERSION, migrateMetaIfNeeded,
  projectR5Matchups, downloadCSV,
} from './lib.js';

import { styles, palette as C } from './styles.js';

import {
  FontInjector, Header, BottomNav,
  MeSetupView,
  LeaderboardView, RoundsListView, FoursomePicker, HoleEntry,
  PlayersView, SettingsView,
} from './components.jsx';

export default function App() {
  const [meta, setMeta] = useState(null);
  const [scores, setScores] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('leaderboard'); // leaderboard | rounds | foursome | entry | players | settings
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [currentFoursomeIndex, setCurrentFoursomeIndex] = useState(0);
  const [currentFoursome, setCurrentFoursome] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSync, setLastSync] = useState(null);
  const [showMeSetup, setShowMeSetup] = useState(false);
  const focusedRef = useRef(0);

  // === Initial load (one-time read from Firestore) ===
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }
      const roundIds = DEFAULT_ROUNDS.map(r => r.id);
      const loaded = await loadAll(roundIds);
      if (cancelled) return;
      // Migrate stored meta if it's from an older schema
      let m = loaded.meta ? await migrateMetaIfNeeded(loaded.meta, persistMeta) : null;
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

  const updateMeta = useCallback((updater) => {
    setMeta(prev => {
      const next = updater(prev);
      persistMeta(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      persistSettings(next);
      return next;
    });
  }, []);

  const updateMe = useCallback((playerId) => {
    setMe(playerId);
    persistMe(playerId);
  }, []);

  const lockR5Finalists = useCallback(() => {
    if (!meta) return;
    const proj = projectR5Matchups(meta, scores, settings);
    if (!proj) {
      alert('Need at least one Anti-Shtick match played in R2/R3/R4 before locking in finalists.');
      return;
    }
    if (!confirm('Lock in R5 matchups based on current standings? This sets:\n\n' +
      `🏆 Championship (${proj.championship.teeTime}): ${meta.teams.find(t => t.id === proj.championship.a)?.name} vs ${meta.teams.find(t => t.id === proj.championship.b)?.name}\n` +
      `Consolation (${proj.consolation.teeTime}): ${meta.teams.find(t => t.id === proj.consolation.a)?.name} vs ${meta.teams.find(t => t.id === proj.consolation.b)?.name}`)) return;
    updateMeta(m => ({
      ...m,
      rounds: m.rounds.map(r => r.id === 'r5' ? {
        ...r,
        matches: [
          { a: proj.championship.a, b: proj.championship.b, teeTime: proj.championship.teeTime },
          { a: proj.consolation.a,  b: proj.consolation.b,  teeTime: proj.consolation.teeTime },
        ],
      } : r),
    }));
  }, [meta, scores, settings, updateMeta]);

  const clearRoundScores = useCallback(async (roundId) => {
    if (!confirm('Clear all scores for this round? This cannot be undone.')) return;
    setScores(prev => ({ ...prev, [roundId]: {} }));
    await persistClearRound(roundId);
  }, []);

  const resetAll = useCallback(async () => {
    if (!confirm('Reset EVERYTHING to defaults? This wipes every score, every edit. There is no undo.')) return;
    const fresh = { players: DEFAULT_PLAYERS, teams: DEFAULT_TEAMS, courses: DEFAULT_COURSES, rounds: DEFAULT_ROUNDS, _schemaVersion: SCHEMA_VERSION };
    setMeta(fresh);
    setScores({});
    setSettings(DEFAULT_SETTINGS);
    await Promise.all([
      persistMeta(fresh),
      persistSettings(DEFAULT_SETTINGS),
      ...DEFAULT_ROUNDS.map(r => persistClearRound(r.id)),
    ]);
  }, []);

  // === Setup-required screen ===
  if (!isFirebaseConfigured) {
    return (
      <div style={styles.appShell}>
        <FontInjector />
        <div style={{ padding: '40px 20px', maxWidth: 500, margin: '0 auto' }}>
          <AlertCircle size={36} color={C.red} style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 700, color: C.greenDark, marginBottom: 8 }}>Firebase setup required</div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, color: C.inkSoft, lineHeight: 1.6, marginBottom: 16 }}>
            The app can't reach its database because the Firebase config is missing. Copy <code style={{ background: C.yellowPaper, padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>.env.example</code> to <code style={{ background: C.yellowPaper, padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>.env</code> and fill in your Firebase project's values. On Vercel, add the same six <code style={{ background: C.yellowPaper, padding: '2px 6px', borderRadius: 3, fontSize: 12 }}>VITE_FIREBASE_*</code> variables in Project Settings → Environment Variables, then redeploy.
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: C.ash }}>
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
        <div style={{ ...styles.center, minHeight: '60vh', fontFamily: 'Fraunces, serif', fontSize: 18, color: C.green }}>
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
    onBlur:  () => { focusedRef.current = Math.max(0, focusedRef.current - 1); },
  };
  const manualRefresh = () => {
    setSyncStatus('saved');
    setLastSync(Date.now());
    setTimeout(() => setSyncStatus(s => s === 'saved' ? 'idle' : s), 800);
  };

  // Saved foursome (per device, per round)
  const allSavedFoursomes = loadFoursomes();
  const savedIndexFor = (rid) => allSavedFoursomes[rid]?.foursomeIndex;

  return (
    <div style={styles.appShell}>
      <FontInjector />
      <Header
        syncStatus={syncStatus} lastSync={lastSync} me={me} players={meta.players}
        onChangeMe={() => setShowMeSetup(true)} onRefresh={manualRefresh}
      />

      {view === 'leaderboard' && (
        <LeaderboardView
          meta={meta} scores={scores} settings={settings}
          onOpenRound={(rid) => { setCurrentRoundId(rid); setView('foursome'); }}
        />
      )}

      {view === 'rounds' && (
        <RoundsListView
          meta={meta} scores={scores}
          onOpen={(rid) => { setCurrentRoundId(rid); setView('foursome'); }}
        />
      )}

      {view === 'foursome' && currentRound && (
        <FoursomePicker
          round={currentRound}
          meta={meta} scores={scores} settings={settings} me={me}
          savedFoursomeIndex={savedIndexFor(currentRound.id)}
          onBack={() => setView('rounds')}
          onLockR5={lockR5Finalists}
          onBegin={(idx, foursome) => {
            setCurrentFoursomeIndex(idx);
            setCurrentFoursome(foursome);
            saveFoursome(currentRound.id, { foursomeIndex: idx, playerIds: foursome.playerIds });
            setView('entry');
          }}
        />
      )}

      {view === 'entry' && currentRound && currentFoursome && (
        <HoleEntry
          round={currentRound}
          foursome={currentFoursome}
          meta={meta} scores={scores} settings={settings} me={me}
          onScoreUpdate={updateScore}
          onBack={() => setView('foursome')}
          onFinish={() => { setView('rounds'); }}
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
            teams:   m.teams.map(t => ({ ...t, playerIds: t.playerIds.filter(pid => pid !== id) })),
          }))}
          onUpdateTeams={(teams) => updateMeta(m => ({ ...m, teams }))}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          meta={meta} settings={settings} scores={scores}
          onUpdateCourse={(id, patch) => updateMeta(m => ({ ...m, courses: { ...m.courses, [id]: { ...m.courses[id], ...patch } } }))}
          onUpdateSettings={updateSettings}
          onUpdateRoundTees={(rid, tees) => updateMeta(m => ({ ...m, rounds: m.rounds.map(r => r.id === rid ? { ...r, tees } : r) }))}
          onReset={resetAll}
          onExport={() => downloadCSV(meta, scores)}
        />
      )}

      <BottomNav view={view} setView={setView} />
    </div>
  );
}
