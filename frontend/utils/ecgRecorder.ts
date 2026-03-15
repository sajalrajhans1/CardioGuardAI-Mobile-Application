import * as Print   from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
export interface RecordingInput {
  patientId:   string;
  patientName: string;
  bpm:         number;
  ecgSamples:  number[];
  timestamp?:  Date;
}

/* ─────────────────────────────────────────────
   10-SECOND SAMPLE COLLECTOR
───────────────────────────────────────────── */
export function createECGRecorder(durationMs = 10_000): {
  push:   (sample: number) => void;
  result: Promise<number[]>;
} {
  const samples: number[] = [];

  const result = new Promise<number[]>((resolve) => {
    setTimeout(() => resolve([...samples]), durationMs);
  });

  return {
    push: (sample: number) => { samples.push(sample); },
    result,
  };
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function normaliseSamples(samples: number[]): number[] {
  if (samples.length === 0) return [];
  const min   = Math.min(...samples);
  const max   = Math.max(...samples);
  const range = max - min || 1;
  const top = 15, usable = 170;
  return samples.map((v) => top + usable - ((v - min) / range) * usable);
}

function buildSVGPath(yVals: number[], w: number): string {
  if (yVals.length < 2) return "";
  const step = w / (yVals.length - 1);
  return yVals
    .map((y, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function buildGrid(w: number): string {
  const h = [...Array(11)].map((_, i) => {
    const y = (i * 200) / 10;
    return `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(0,200,100,0.08)" stroke-width="1"/>`;
  }).join("");
  const v = [...Array(21)].map((_, i) => {
    const x = (i * w) / 20;
    return `<line x1="${x}" y1="0" x2="${x}" y2="200" stroke="rgba(0,200,100,0.05)" stroke-width="1"/>`;
  }).join("");
  return h + v;
}

function riskLabel(bpm: number): { text: string; color: string } {
  if (bpm > 140) return { text: "CRITICAL",     color: "#7F1D1D" };
  if (bpm > 120) return { text: "TACHYCARDIA",  color: "#DC2626" };
  if (bpm > 0 && bpm < 45) return { text: "BRADYCARDIA", color: "#DC2626" };
  if (bpm > 100) return { text: "ELEVATED",     color: "#F59E0B" };
  if (bpm === 0) return { text: "UNKNOWN",      color: "#64748B" };
  return               { text: "NORMAL",        color: "#16A34A" };
}

function buildHtml(
  patientId: string,
  patientName: string,
  avgBpm: number,
  ecgSamples: number[],
  timestamp: Date,
  isCritical: boolean,
): string {
  const svgWidth  = 900;
  const yVals     = normaliseSamples(ecgSamples);
  const pathData  = buildSVGPath(yVals, svgWidth);
  const gridSVG   = buildGrid(svgWidth);
  const risk      = riskLabel(avgBpm);
  const dateStr   = timestamp.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr   = timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const critBanner = isCritical
    ? `<div style="background:#7F1D1D;color:white;padding:12px 20px;border-radius:10px;font-weight:800;font-size:14px;margin-bottom:20px;letter-spacing:0.5px;">
        ⚠️ CRITICAL CARDIAC EVENT — Automatically recorded for doctor review
       </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>CardioGuard AI – ECG Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:#F3F6FB; color:#0F172A; padding:40px; }
    .header { display:flex; align-items:center; justify-content:space-between; padding-bottom:24px; border-bottom:2px solid #2563EB; margin-bottom:28px; }
    .brand  { display:flex; align-items:center; gap:14px; }
    .brand-icon { width:48px; height:48px; background:#2563EB; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; }
    .brand-text h1 { font-size:22px; font-weight:800; }
    .brand-text p  { font-size:13px; color:#64748B; margin-top:2px; }
    .report-badge  { background:#EAF2FF; color:#2563EB; font-size:12px; font-weight:700; padding:6px 14px; border-radius:20px; letter-spacing:0.5px; }
    .meta-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
    .meta-card { background:#fff; border-radius:14px; padding:16px 20px; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
    .meta-label { font-size:10px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:6px; }
    .meta-value { font-size:18px; font-weight:800; }
    .meta-value.bpm { font-size:32px; color:#2563EB; }
    .risk-chip { display:inline-block; font-size:11px; font-weight:800; padding:4px 10px; border-radius:20px; margin-top:4px; letter-spacing:0.5px; }
    .ecg-section { background:#080D13; border-radius:18px; padding:20px; margin-bottom:24px; border:1px solid rgba(0,255,127,0.15); }
    .ecg-header { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
    .ecg-dot { width:8px; height:8px; background:#00FF7F; border-radius:50%; }
    .ecg-title { font-size:14px; font-weight:700; color:#00FF7F; }
    svg.ecg-chart { width:100%; height:200px; display:block; }
    .disclaimer { background:#FFFBEB; border:1px solid #FDE68A; border-radius:10px; padding:12px 16px; font-size:12px; color:#92400E; margin-bottom:20px; }
    .footer { display:flex; justify-content:space-between; padding-top:20px; border-top:1px solid #E2E8F0; font-size:11px; color:#94A3B8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-icon">❤️</div>
      <div class="brand-text"><h1>CardioGuard AI</h1><p>Cardiac Monitoring System</p></div>
    </div>
    <div class="report-badge">ECG REPORT</div>
  </div>

  ${critBanner}

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">Patient</div>
      <div class="meta-value" style="font-size:16px">${patientName}</div>
      <div class="meta-label" style="margin-top:4px">ID: ${patientId}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Average BPM</div>
      <div class="meta-value bpm">${avgBpm > 0 ? avgBpm : "—"} <span style="font-size:16px;color:#64748B">BPM</span></div>
      <div class="risk-chip" style="background:${risk.color}18;color:${risk.color}">${risk.text}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Recorded</div>
      <div class="meta-value" style="font-size:14px">${dateStr}</div>
      <div class="meta-label" style="margin-top:4px">${timeStr}</div>
    </div>
  </div>

  <div class="ecg-section">
    <div class="ecg-header">
      <div class="ecg-dot"></div>
      <span class="ecg-title">ECG Waveform — ${ecgSamples.length} samples</span>
    </div>
    <svg class="ecg-chart" viewBox="0 0 ${svgWidth} 200" preserveAspectRatio="none">
      ${gridSVG}
      <path d="${pathData}" stroke="rgba(0,255,127,0.22)" stroke-width="6" fill="none"/>
      <path d="${pathData}" stroke="#00FF7F" stroke-width="2" fill="none"/>
    </svg>
  </div>

  <div class="disclaimer">
    ⚠️ This report is generated by CardioGuard AI for monitoring purposes only and does not constitute
    a medical diagnosis. Consult a qualified cardiologist for clinical evaluation.
  </div>

  <div class="footer">
    <span>Generated by CardioGuard AI · ${timeStr}, ${dateStr}</span>
    <span>Patient ID: ${patientId}</span>
  </div>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
   GENERATE PDF AND SAVE LOCALLY
   Returns the local file URI so it can be shared later.
───────────────────────────────────────────── */
export async function generateECGPDF(
  input: RecordingInput,
  isCritical = false,
): Promise<string> {
  const {
    patientId,
    patientName,
    bpm,
    ecgSamples,
    timestamp = new Date(),
  } = input;

  const avgBpm = bpm > 0
    ? bpm
    : ecgSamples.length > 0
      ? Math.round(ecgSamples.reduce((a, b) => a + b, 0) / ecgSamples.length)
      : 0;

  const html = buildHtml(patientId, patientName, avgBpm, ecgSamples, timestamp, isCritical);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  /* Copy into a permanent location inside app documents directory */
  const fileName = `CardioGuard_ECG_${Date.now()}.pdf`;
  const dest     = (FileSystem.documentDirectory ?? "") + fileName;
  await FileSystem.copyAsync({ from: uri, to: dest });

  return dest; // local URI — caller can share or keep
}

/* ─────────────────────────────────────────────
   GENERATE PDF AND SHARE (manual recording flow)
───────────────────────────────────────────── */
export async function generateAndShareECGReport(input: RecordingInput): Promise<void> {
  const dest = await generateECGPDF(input, false);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Sharing is not available on this device.");

  await Sharing.shareAsync(dest, {
    mimeType:    "application/pdf",
    dialogTitle: `ECG Report – ${input.patientName}`,
    UTI:         "com.adobe.pdf",
  });
}