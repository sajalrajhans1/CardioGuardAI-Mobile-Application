import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { classifyBpm, HeartStatus } from "./theme";

const WS_URL = "ws://172.16.2.50:8080";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EcgReading {
  ecg:       number;
  bpm:       number;
  timestamp: Date;
}

export interface PatientVitals {
  bpm:             number;
  status:          HeartStatus;
  deviceConnected: boolean;
  wsConnected:     boolean;
  lastUpdated:     Date;
  ecgHistory:      EcgReading[];   // last 60 readings for mini-chart
  alerts:          AlertEntry[];
}

export interface AlertEntry {
  id:        string;
  type:      HeartStatus;
  bpm:       number;
  message:   string;
  timestamp: Date;
  read:      boolean;
}

interface CaretakerWsContextType {
  vitals:      PatientVitals;
  reconnect:   () => void;
  markAlertRead: (id: string) => void;
  clearAlerts: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultVitals: PatientVitals = {
  bpm:             0,
  status:          "NORMAL",
  deviceConnected: false,
  wsConnected:     false,
  lastUpdated:     new Date(),
  ecgHistory:      [],
  alerts:          [],
};

// ─── Context ──────────────────────────────────────────────────────────────────

const CaretakerWsContext = createContext<CaretakerWsContextType>({
  vitals:        defaultVitals,
  reconnect:     () => {},
  markAlertRead: () => {},
  clearAlerts:   () => {},
});

export const useCaretakerWs = () => useContext(CaretakerWsContext);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CaretakerWsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vitals, setVitals] = useState<PatientVitals>(defaultVitals);
  const ws                  = useRef<WebSocket | null>(null);
  const prevStatus          = useRef<HeartStatus>("NORMAL");

  const connect = useCallback(() => {
    if (ws.current) ws.current.close();

    const socket = new WebSocket(WS_URL);
    ws.current   = socket;

    socket.onopen = () =>
      setVitals((v) => ({ ...v, wsConnected: true }));

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "connected") {
          setVitals((v) => ({ ...v, deviceConnected: true }));

        } else if (msg.type === "disconnected") {
          setVitals((v) => ({ ...v, deviceConnected: false }));

        } else if (msg.type === "ecg" && typeof msg.bpm === "number") {
          const bpm    = msg.bpm;
          const status = classifyBpm(bpm);
          const now    = new Date();

          const reading: EcgReading = { ecg: msg.ecg ?? 0, bpm, timestamp: now };

          setVitals((v) => {
            const history = [...v.ecgHistory, reading].slice(-60);
            const alerts  = [...v.alerts];

            // Generate alert when status worsens
            if (
              (status === "CRITICAL" && prevStatus.current !== "CRITICAL") ||
              (status === "WARNING"  && prevStatus.current === "NORMAL")
            ) {
              const alertMsg =
                status === "CRITICAL"
                  ? bpm < 50
                    ? `Dangerously low BPM detected: ${bpm}`
                    : `Dangerously high BPM detected: ${bpm}`
                  : bpm < 60
                  ? `Low heart rate: ${bpm} BPM`
                  : `Elevated heart rate: ${bpm} BPM`;

              alerts.unshift({
                id:        `${Date.now()}`,
                type:      status,
                bpm,
                message:   alertMsg,
                timestamp: now,
                read:      false,
              });
            }

            prevStatus.current = status;

            return {
              ...v,
              bpm,
              status,
              lastUpdated: now,
              ecgHistory:  history,
              alerts:      alerts.slice(0, 50), // keep last 50
            };
          });
        }
      } catch (err) {
        console.warn("WS parse error:", err);
      }
    };

    socket.onerror = () =>
      setVitals((v) => ({ ...v, wsConnected: false }));

    socket.onclose = () =>
      setVitals((v) => ({ ...v, wsConnected: false, deviceConnected: false }));
  }, []);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, []);

  const markAlertRead = useCallback((id: string) => {
    setVitals((v) => ({
      ...v,
      alerts: v.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    }));
  }, []);

  const clearAlerts = useCallback(() => {
    setVitals((v) => ({ ...v, alerts: [] }));
  }, []);

  return (
    <CaretakerWsContext.Provider
      value={{ vitals, reconnect: connect, markAlertRead, clearAlerts }}
    >
      {children}
    </CaretakerWsContext.Provider>
  );
};