// Firestore storage adapter.
//
// Mirrors the API of the original window.storage layer so App.jsx changes
// are minimal. Firestore handles concurrency naturally — updateDoc with
// dot-notation field paths atomically updates individual cells.
//
// Layout in Firestore (collection = "bandon-2026" by default):
//   {COLLECTION}/meta       → players, teams, courses, rounds, _schemaVersion
//   {COLLECTION}/settings   → handicapAllowance, skinsCarryover, etc.
//   {COLLECTION}/scores-r1  → { [playerId]: { [holeIdx]: score } }
//   ...one scores-rN doc per round
//
// "Me" (per-device identifier) stays in localStorage since it's per-browser.

import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField,
} from 'firebase/firestore';
import { db, COLLECTION, isFirebaseConfigured } from './firebase.js';

export { isFirebaseConfigured };

const ME_KEY = `bandon-me-${COLLECTION}`;

// ---------- Doc refs ----------
const metaRef = () => doc(db, COLLECTION, 'meta');
const settingsRef = () => doc(db, COLLECTION, 'settings');
const scoresRef = (roundId) => doc(db, COLLECTION, `scores-${roundId}`);

// ---------- Score format conversion ----------
// Firestore stores scores as a map { "0": 4, "1": 5, ... } for atomic field updates.
// App state uses arrays [4, 5, null, ...] of length 18.

function scoreMapToArray(map) {
  const arr = Array(18).fill(null);
  if (!map || typeof map !== 'object') return arr;
  Object.entries(map).forEach(([k, v]) => {
    const i = parseInt(k, 10);
    if (i >= 0 && i < 18 && v !== null && v !== undefined) arr[i] = v;
  });
  return arr;
}

function normalizeRoundScores(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  Object.entries(raw).forEach(([playerId, value]) => {
    out[playerId] = scoreMapToArray(value);
  });
  return out;
}

// ---------- Initial load ----------
export async function loadAll(roundIds) {
  if (!isFirebaseConfigured) {
    return { meta: null, settings: null, me: null, scores: {} };
  }
  const [metaSnap, settingsSnap, ...scoreSnaps] = await Promise.all([
    getDoc(metaRef()),
    getDoc(settingsRef()),
    ...roundIds.map((rid) => getDoc(scoresRef(rid))),
  ]);
  const meta = metaSnap.exists() ? metaSnap.data() : null;
  const settings = settingsSnap.exists() ? settingsSnap.data() : null;
  const me = typeof window !== 'undefined' ? (localStorage.getItem(ME_KEY) || null) : null;
  const scores = {};
  scoreSnaps.forEach((snap, i) => {
    scores[roundIds[i]] = snap.exists() ? normalizeRoundScores(snap.data()) : {};
  });
  return { meta, settings, me, scores };
}

// ---------- Real-time subscriptions ----------
// Replaces the old 25-second polling loop. Firestore pushes updates
// to all subscribed clients within ~1 second.
export function subscribeAll(roundIds, callbacks) {
  if (!isFirebaseConfigured) return () => {};
  const unsubs = [
    onSnapshot(metaRef(), (snap) => {
      callbacks.onMeta?.(snap.exists() ? snap.data() : null);
    }),
    onSnapshot(settingsRef(), (snap) => {
      callbacks.onSettings?.(snap.exists() ? snap.data() : null);
    }),
    ...roundIds.map((rid) =>
      onSnapshot(scoresRef(rid), (snap) => {
        callbacks.onScores?.(rid, snap.exists() ? normalizeRoundScores(snap.data()) : {});
      })
    ),
  ];
  return () => unsubs.forEach((fn) => fn());
}

// ---------- Score writes ----------
// Atomic single-cell update using dot-notation field path.
// No read-merge-write race window; Firestore handles concurrency.
export async function persistScoreCell(roundId, playerId, holeIdx, value) {
  if (!isFirebaseConfigured) return { ok: false };
  const ref = scoresRef(roundId);
  const fieldPath = `${playerId}.${holeIdx}`;
  try {
    if (value === null || value === undefined || value === '') {
      // setDoc with merge creates doc if missing; updateDoc would fail on missing doc
      await setDoc(ref, { [playerId]: { [holeIdx]: null } }, { merge: true });
      // Then delete the field cleanly
      try {
        await updateDoc(ref, { [fieldPath]: deleteField() });
      } catch { /* missing doc edge case; already null */ }
    } else {
      // Try update first (fast). Fall back to setDoc if doc doesn't exist.
      try {
        await updateDoc(ref, { [fieldPath]: value });
      } catch {
        await setDoc(ref, { [playerId]: { [holeIdx]: value } }, { merge: true });
      }
    }
    return { ok: true };
  } catch (err) {
    console.error('Score persist failed:', err);
    return { ok: false, error: err };
  }
}

export async function persistClearRound(roundId) {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(scoresRef(roundId), {}); // overwrite with empty
    return true;
  } catch (err) {
    console.error('Clear round failed:', err);
    return false;
  }
}

// ---------- Meta / Settings ----------
export async function persistMeta(meta) {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(metaRef(), meta);
    return true;
  } catch (err) {
    console.error('Persist meta failed:', err);
    return false;
  }
}

export async function persistSettings(settings) {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(settingsRef(), settings);
    return true;
  } catch (err) {
    console.error('Persist settings failed:', err);
    return false;
  }
}

// ---------- Per-device "me" identifier ----------
export function persistMe(playerId) {
  if (!playerId) return false;
  try {
    if (typeof window !== 'undefined') localStorage.setItem(ME_KEY, playerId);
    return true;
  } catch {
    return false;
  }
}

// ---------- Per-device foursome selections ----------
// Each device remembers which 4 players they were playing with on each round.
// Saved in localStorage as { [roundId]: [pid, pid, pid, pid] }.
const FOURSOMES_KEY = `bandon-foursomes-${COLLECTION}`;

export function loadFoursomes() {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(FOURSOMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFoursome(roundId, playerIds) {
  try {
    if (typeof window === 'undefined') return false;
    const all = loadFoursomes();
    all[roundId] = playerIds;
    localStorage.setItem(FOURSOMES_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function clearFoursome(roundId) {
  try {
    if (typeof window === 'undefined') return false;
    const all = loadFoursomes();
    delete all[roundId];
    localStorage.setItem(FOURSOMES_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}
