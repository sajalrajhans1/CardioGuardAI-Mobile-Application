import { useEffect, useRef, useCallback, useState } from "react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const WS_URL              = "ws://172.16.2.50:8080";
const BUFFER_SIZE         = 300;
const RECONNECT_MS        = 3000;
const SMOOTH_WINDOW       = 3;
const ALERT_COOLDOWN_MS   = 60_000;   // minimum gap between repeated arrhythmia alerts

/**
 * Fix 1 — Signal timeout.
 * If no ECG sample arrives for this many ms, mark device as disconnected.
 */
const SIGNAL_TIMEOUT_MS   = 2000;

/** BPM thresholds */
const HIGH_BPM_THRESHOLD     = 120;   // Feature 3 — exercise guidance
const CRITICAL_BPM_THRESHOLD = 140;   // Feature 4 — auto ECG recording
const BRADY_THRESHOLD        = 45;

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export type ArrhythmiaType = "tachycardia" | "bradycardia";

export interface ArrhythmiaEvent {
  type:      ArrhythmiaType;
  bpm:       number;
  timestamp: Date;
}

export interface ECGState {
  bpm:       number;
  ecg:       number[];
  connected: boolean;
  leadOff:   boolean;
}

export interface ECGStreamCallbacks {
  onArrhythmia?:  (event: ArrhythmiaEvent) => void;
  /** Called once per event when BPM > 120 (resets when BPM normalises) */
  onHighBpm?:     (bpm: number) => void;
  /** Called once per event when BPM > 140 (resets when BPM normalises) */
  onCriticalBpm?: (bpm: number) => void;
}

interface ServerMessage {
  type:   "ecg" | "ecg_demo" | "lead_off" | "disconnected" | "connected";
  ecg?:   number;
  bpm?:   number;
  value?: number;
}

/* ─────────────────────────────────────────────
   HOOK
───────────────────────────────────────────── */
export function useECGStream(callbacks?: ECGStreamCallbacks): ECGState {
  const [state, setState] = useState<ECGState>({
    bpm:       0,
    ecg:       new Array(BUFFER_SIZE).fill(512),
    connected: false,
    leadOff:   false,
  });

  /* ── Internal refs (never cause re-renders) ── */
  const circularBuf        = useRef<number[]>(new Array(BUFFER_SIZE).fill(512));
  const writeIdx           = useRef(0);
  const liveBpm            = useRef(0);
  const smoothBuf          = useRef<number[]>([]);
  const lastAlertAt        = useRef<Record<string, number>>({});
  const wsRef              = useRef<WebSocket | null>(null);
  const reconnectTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signalTimeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted          = useRef(false);
  const callbacksRef       = useRef(callbacks);
  callbacksRef.current     = callbacks;

  /* BPM alert flags — reset when BPM returns to normal */
  const highBpmAlertShown     = useRef(false);
  const criticalBpmAlertShown = useRef(false);

  /* ── Smoothing ── */
  const smooth = useCallback((raw: number): number => {
    const buf = smoothBuf.current;
    buf.push(raw);
    if (buf.length > SMOOTH_WINDOW) buf.shift();
    return Math.round(buf.reduce((a, b) => a + b, 0) / buf.length);
  }, []);

  /* ── Flush circular buffer → React state ── */
  const flushBuffer = useCallback((bpm: number) => {
    if (unmounted.current) return;
    const buf   = circularBuf.current;
    const start = writeIdx.current;
    const snap: number[] = [...buf.slice(start), ...buf.slice(0, start)];
    setState((prev) => ({ ...prev, bpm, ecg: snap, connected: true, leadOff: false }));
  }, []);

  /* ── Write one sample ── */
  const writeSample = useCallback((raw: number) => {
    const v = smooth(raw);
    circularBuf.current[writeIdx.current] = v;
    writeIdx.current = (writeIdx.current + 1) % BUFFER_SIZE;
  }, [smooth]);

  /* ── Fix 1: Reset signal timeout — called on every ECG sample ── */
  const resetSignalTimeout = useCallback(() => {
    if (signalTimeoutTimer.current) clearTimeout(signalTimeoutTimer.current);
    signalTimeoutTimer.current = setTimeout(() => {
      if (unmounted.current) return;
      // No sample for SIGNAL_TIMEOUT_MS ms → mark disconnected
      setState((prev) => ({ ...prev, connected: false, leadOff: true }));
    }, SIGNAL_TIMEOUT_MS);
  }, []);

  /* ── BPM checks: arrhythmia + high/critical callbacks ── */
  const checkBpm = useCallback((bpm: number) => {
    const now = Date.now();

    /* Arrhythmia detection */
    if (bpm > HIGH_BPM_THRESHOLD) {
      const last = lastAlertAt.current["tachycardia"] ?? 0;
      if (now - last >= ALERT_COOLDOWN_MS) {
        lastAlertAt.current["tachycardia"] = now;
        callbacksRef.current?.onArrhythmia?.({ type: "tachycardia", bpm, timestamp: new Date() });
      }
    } else if (bpm > 0 && bpm < BRADY_THRESHOLD) {
      const last = lastAlertAt.current["bradycardia"] ?? 0;
      if (now - last >= ALERT_COOLDOWN_MS) {
        lastAlertAt.current["bradycardia"] = now;
        callbacksRef.current?.onArrhythmia?.({ type: "bradycardia", bpm, timestamp: new Date() });
      }
    }

    /* Feature 3 — high BPM guidance (> 120, fires once per event) */
    if (bpm > HIGH_BPM_THRESHOLD) {
      if (!highBpmAlertShown.current) {
        highBpmAlertShown.current = true;
        callbacksRef.current?.onHighBpm?.(bpm);
      }
    } else {
      // BPM has normalised — reset flag so next high-BPM event triggers again
      highBpmAlertShown.current = false;
    }

    /* Feature 4 — critical BPM auto-recording (> 140, fires once per event) */
    if (bpm > CRITICAL_BPM_THRESHOLD) {
      if (!criticalBpmAlertShown.current) {
        criticalBpmAlertShown.current = true;
        callbacksRef.current?.onCriticalBpm?.(bpm);
      }
    } else {
      criticalBpmAlertShown.current = false;
    }
  }, []);

  /* ── Handle one parsed server message ── */
  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {

      case "ecg":
      case "ecg_demo": {
        /* Fix 1 — restart timeout on every valid sample */
        resetSignalTimeout();

        /* Fix 2 — read bpm field directly from message */
        const bpmVal = typeof msg.bpm === "number" && msg.bpm > 0 ? msg.bpm : 0;
        const ecgVal = msg.ecg ?? msg.value;

        if (bpmVal > 0) {
          liveBpm.current = bpmVal;
          checkBpm(bpmVal);
        }

        if (ecgVal !== undefined && !isNaN(ecgVal)) {
          writeSample(ecgVal);
          flushBuffer(liveBpm.current);
        }
        break;
      }

      case "lead_off": {
        /* lead_off from server — mark signal loss immediately */
        if (!unmounted.current) {
          setState((prev) => ({ ...prev, connected: false, leadOff: true }));
        }
        break;
      }

      case "connected": {
        if (!unmounted.current) {
          setState((prev) => ({ ...prev, connected: true, leadOff: false }));
        }
        break;
      }

      case "disconnected": {
        if (!unmounted.current) {
          setState((prev) => ({ ...prev, connected: false }));
        }
        break;
      }
    }
  }, [resetSignalTimeout, writeSample, flushBuffer, checkBpm]);

  /* ── WebSocket lifecycle ── */
  const connect = useCallback(() => {
    if (unmounted.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (unmounted.current) { ws.close(); return; }
      setState((prev) => ({ ...prev, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const raw = typeof event.data === "string" ? event.data : String(event.data);

        raw.split("\n").forEach((chunk) => {
          const trimmed = chunk.trim();
          if (!trimmed) return;

          /* JSON — primary path */
          if (trimmed.startsWith("{")) {
            try { handleMessage(JSON.parse(trimmed) as ServerMessage); } catch { /* skip */ }
            return;
          }

          /* Legacy plain-text fallbacks */
          if (trimmed.includes("LEAD_OFF")) { handleMessage({ type: "lead_off" }); return; }

          if (trimmed.startsWith("ECG:")) {
            const v = parseInt(trimmed.slice(4), 10);
            if (!isNaN(v)) handleMessage({ type: "ecg", ecg: v, bpm: liveBpm.current });
            return;
          }

          if (trimmed.includes(",")) {
            const [b, e] = trimmed.split(",");
            const bv = parseInt(b, 10);
            const ev = parseInt(e, 10);
            if (!isNaN(bv) && bv > 0) liveBpm.current = bv;
            if (!isNaN(ev)) handleMessage({ type: "ecg", ecg: ev, bpm: liveBpm.current });
            return;
          }

          const n = parseInt(trimmed, 10);
          if (!isNaN(n)) handleMessage({ type: "ecg", ecg: n, bpm: liveBpm.current });
        });
      } catch { /* swallow */ }
    };

    ws.onerror = () => {
      if (unmounted.current) return;
      setState((prev) => ({ ...prev, connected: false }));
    };

    ws.onclose = () => {
      if (unmounted.current) return;
      setState((prev) => ({ ...prev, connected: false }));
      reconnectTimer.current = setTimeout(() => {
        if (!unmounted.current) connect();
      }, RECONNECT_MS);
    };
  }, [handleMessage]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (signalTimeoutTimer.current) clearTimeout(signalTimeoutTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return state;
}