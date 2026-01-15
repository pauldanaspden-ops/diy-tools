"use client";

import { useMemo, useState } from "react";
import { PaintProjectSchema, paintDefaults, type PaintFormState } from "@/lib/tools/paint/schema";
import { calcPaint } from "@/lib/tools/paint/engine";

type FormState = typeof paintDefaults;

function toNumber(value: string) {
  // allow empty while typing
  if (value.trim() === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.floor(n);
  return Math.max(min, Math.min(max, v));
}

export default function PaintCalculator() {
  const [form, setForm] = useState<FormState>(paintDefaults);
  const [hasCalculated, setHasCalculated] = useState(false);

  const parsed = useMemo(() => PaintProjectSchema.safeParse(form), [form]);

  const result = useMemo(() => {
    if (!hasCalculated) return null;
    if (!parsed.success) return null;
    return calcPaint(parsed.data);
  }, [parsed, hasCalculated]);

  function onReset() {
    setForm(paintDefaults);
    setHasCalculated(false);
  }

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
      {/* Inputs */}
      <section style={{ border: "1px solid #333", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Room details</h2>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            Length (m)
            <input
              type="number"
              step="0.1"
              value={Number.isNaN(form.lengthM) ? "" : form.lengthM}
              onChange={(e) => setForm({ ...form, lengthM: toNumber(e.target.value) })}
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Width (m)
            <input
              type="number"
              step="0.1"
              value={Number.isNaN(form.widthM) ? "" : form.widthM}
              onChange={(e) => setForm({ ...form, widthM: toNumber(e.target.value) })}
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Ceiling height (m)
            <input
              type="number"
              step="0.1"
              value={Number.isNaN(form.heightM) ? "" : form.heightM}
              onChange={(e) => setForm({ ...form, heightM: toNumber(e.target.value) })}
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Doors
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.doorsCount) ? "" : form.doorsCount}
              onChange={(e) =>
                setForm({
                  ...form,
                  doorsCount: clampInt(toNumber(e.target.value), 0, 20),
                })
              }
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Windows
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.windowsCount) ? "" : form.windowsCount}
              onChange={(e) =>
                setForm({
                  ...form,
                  windowsCount: clampInt(toNumber(e.target.value), 0, 40),
                })
              }
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Coats (1–3)
            <input
              type="number"
              step="1"
              min="1"
              max="3"
              value={Number.isNaN(form.coats) ? "" : form.coats}
              onChange={(e) =>
                setForm({
                  ...form,
                  coats: clampInt(toNumber(e.target.value), 1, 3) as 1 | 2 | 3,
                })
              }
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Coverage (m²/L)
            <input
              type="number"
              step="0.5"
              value={Number.isNaN(form.coverageM2PerL) ? "" : form.coverageM2PerL}
              onChange={(e) => setForm({ ...form, coverageM2PerL: toNumber(e.target.value) })}
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Waste (%)
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.wastePct) ? "" : form.wastePct}
              onChange={(e) => setForm({ ...form, wastePct: toNumber(e.target.value) })}
              style={{ padding: 8 }}
            />
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 10 }}>
            <input
              type="checkbox"
              checked={form.includeCeiling}
              onChange={(e) => setForm({ ...form, includeCeiling: e.target.checked })}
            />
            Include ceiling
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Price per litre (optional)
            <input
              type="number"
              step="0.5"
              value={form.pricePerL ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  pricePerL: e.target.value.trim() === "" ? undefined : toNumber(e.target.value),
                })
              }
              style={{ padding: 8 }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={() => setHasCalculated(true)}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #666",
              cursor: "pointer",
            }}
          >
            Calculate
          </button>

          <button
            onClick={onReset}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #666",
              cursor: "pointer",
              opacity: 0.9,
            }}
          >
            Reset
          </button>
        </div>

        {hasCalculated && !parsed.success && (
          <p style={{ marginTop: 12, color: "tomato" }}>
            Please check your inputs — some values are missing or out of range.
          </p>
        )}
      </section>

      {/* Results */}
      <section style={{ border: "1px solid #333", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Results</h2>

        {!hasCalculated ? (
          <p>Enter your room details and click <b>Calculate</b>.</p>
        ) : result ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div>
              Paintable area: <b>{result.paintableAreaM2.toFixed(1)} m²</b>
            </div>
            <div>Litres (raw): {result.litresRaw.toFixed(2)} L</div>
            <div>Litres (with waste): {result.litresWithWaste.toFixed(2)} L</div>
            <div>
              Recommended to buy: <b>{result.litresRounded.toFixed(1)} L</b>
            </div>
            <div>
              Suggested cans:{" "}
              <b>{result.recommendedCans.map((c) => `${c.qty}×${c.sizeL}L`).join(", ")}</b>
            </div>
            {typeof result.estimatedCost === "number" && (
              <div>
                Estimated cost: <b>${result.estimatedCost}</b>
              </div>
            )}
          </div>
        ) : (
          <p>Fix inputs above to see results.</p>
        )}
      </section>

      {/* Shopping List */}
      <section style={{ border: "1px solid #333", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Shopping list</h2>

        {result ? (
          <ul style={{ display: "grid", gap: 6 }}>
            <li>
              Paint: <b>{result.litresRounded.toFixed(1)} L</b> (see suggested can sizes above)
            </li>
            <li>Roller + tray</li>
            <li>2× brushes (cut-in + trim)</li>
            <li>Painters tape</li>
            <li>Drop sheets / plastic</li>
            <li>Sugar soap / wall cleaner</li>
            <li>Filler + sanding sheets (if patching)</li>
          </ul>
        ) : (
          <p>Calculate first to generate a paint quantity.</p>
        )}
      </section>
    </div>
  );
}
