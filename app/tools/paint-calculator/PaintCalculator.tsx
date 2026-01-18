"use client";

import { useMemo, useState } from "react";
import {
  PaintProjectSchema,
  paintDefaults,
  type PaintFormState,
} from "@/lib/tools/paint/schema";
import { calcPaint } from "@/lib/tools/paint/engine";

function toNumber(value: string) {
  if (value.trim() === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.floor(n);
  return Math.max(min, Math.min(max, v));
}

const fieldLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  minWidth: 0,
};

export default function PaintCalculator() {
  const [form, setForm] = useState<PaintFormState>(paintDefaults);
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
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Room details</h2>

        {/* STEP 3: Mode toggle */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <button
            className={form.mode === "simple" ? "primary" : ""}
            onClick={() => setForm({ ...form, mode: "simple" })}
            type="button"
          >
            Simple room
          </button>

          <button
            className={form.mode === "walls" ? "primary" : ""}
            onClick={() =>
              setForm({
                ...form,
                mode: "walls",
                walls: form.walls?.length ? form.walls : [{ lengthM: 4 }],
                excludedAreas: form.excludedAreas ?? [],
              })
            }
            type="button"
          >
            Measure wall-by-wall
          </button>
        </div>

        {/* Shared inputs grid */}
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            alignItems: "start",
          }}
        >
          {/* STEP 3: Simple mode shows length/width */}
          {form.mode === "simple" && (
            <>
              <label style={fieldLabelStyle}>
                Length (m)
                <input
                  type="number"
                  step="0.1"
                  value={Number.isNaN(form.lengthM) ? "" : form.lengthM}
                  onChange={(e) => setForm({ ...form, lengthM: toNumber(e.target.value) })}
                />
              </label>

              <label style={fieldLabelStyle}>
                Width (m)
                <input
                  type="number"
                  step="0.1"
                  value={Number.isNaN(form.widthM) ? "" : form.widthM}
                  onChange={(e) => setForm({ ...form, widthM: toNumber(e.target.value) })}
                />
              </label>
            </>
          )}

          {/* Shared */}
          <label style={fieldLabelStyle}>
            Ceiling height (m)
            <input
              type="number"
              step="0.1"
              value={Number.isNaN(form.heightM) ? "" : form.heightM}
              onChange={(e) => setForm({ ...form, heightM: toNumber(e.target.value) })}
            />
          </label>

          <label style={fieldLabelStyle}>
            Doors
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.doorsCount) ? "" : form.doorsCount}
              onChange={(e) =>
                setForm({ ...form, doorsCount: clampInt(toNumber(e.target.value), 0, 20) })
              }
            />
          </label>

          <label style={fieldLabelStyle}>
            Windows
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.windowsCount) ? "" : form.windowsCount}
              onChange={(e) =>
                setForm({ ...form, windowsCount: clampInt(toNumber(e.target.value), 0, 40) })
              }
            />
          </label>

          <label style={fieldLabelStyle}>
            Coats (1–3)
            <input
              type="number"
              min="1"
              max="3"
              step="1"
              value={Number.isNaN(form.coats) ? "" : form.coats}
              onChange={(e) =>
                setForm({
                  ...form,
                  coats: clampInt(toNumber(e.target.value), 1, 3) as 1 | 2 | 3,
                })
              }
            />
          </label>

          <label style={fieldLabelStyle}>
            Coverage (m²/L)
            <input
              type="number"
              step="0.5"
              value={Number.isNaN(form.coverageM2PerL) ? "" : form.coverageM2PerL}
              onChange={(e) => setForm({ ...form, coverageM2PerL: toNumber(e.target.value) })}
            />
          </label>

          <label style={fieldLabelStyle}>
            Waste (%)
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.wastePct) ? "" : form.wastePct}
              onChange={(e) => setForm({ ...form, wastePct: toNumber(e.target.value) })}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 26 }}>
            <input
              type="checkbox"
              checked={form.includeCeiling}
              onChange={(e) => setForm({ ...form, includeCeiling: e.target.checked })}
            />
            Include ceiling
          </label>

          <label style={fieldLabelStyle}>
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
            />
          </label>
        </div>

        {/* STEP 4: Wall-by-wall inputs */}
        {form.mode === "walls" && (
          <div style={{ marginTop: 16 }}>
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Walls to be painted</h3>
              <p style={{ marginTop: 0 }}>
                Walk around the room and enter the length of each wall you’ll paint.
              </p>

              {(form.walls ?? []).map((wall, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: "1fr auto auto",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="number"
                    step="0.1"
                    value={Number.isNaN(wall.lengthM) ? "" : wall.lengthM}
                    onChange={(e) => {
                      const walls = [...(form.walls ?? [])];
                      walls[index] = { lengthM: toNumber(e.target.value) };
                      setForm({ ...form, walls });
                    }}
                  />
                  <span>m</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        walls: (form.walls ?? []).filter((_, i) => i !== index),
                      })
                    }
                    title="Remove wall"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setForm({ ...form, walls: [...(form.walls ?? []), { lengthM: 3 }] })}
              >
                + Add wall
              </button>
            </div>

            {/* STEP 5: Excluded areas */}
            <div className="card" style={{ padding: 16, marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Areas not being painted (optional)</h3>
              <p style={{ marginTop: 0 }}>
                Useful for kitchens (cabinets), tiled splashbacks, wardrobes, feature stone, etc.
              </p>

              {(form.excludedAreas ?? []).map((ex, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: "1fr 140px auto auto",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="text"
                    placeholder="e.g. Cabinets"
                    value={ex.label ?? ""}
                    onChange={(e) => {
                      const excludedAreas = [...(form.excludedAreas ?? [])];
                      excludedAreas[index] = { ...ex, label: e.target.value };
                      setForm({ ...form, excludedAreas });
                    }}
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={Number.isNaN(ex.areaM2) ? "" : ex.areaM2}
                    onChange={(e) => {
                      const excludedAreas = [...(form.excludedAreas ?? [])];
                      excludedAreas[index] = { ...ex, areaM2: toNumber(e.target.value) };
                      setForm({ ...form, excludedAreas });
                    }}
                  />
                  <span>m²</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        excludedAreas: (form.excludedAreas ?? []).filter((_, i) => i !== index),
                      })
                    }
                    title="Remove excluded area"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    excludedAreas: [...(form.excludedAreas ?? []), { label: "Cabinets", areaM2: 3 }],
                  })
                }
              >
                + Add excluded area
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Novice help */}
        <details style={{ marginTop: 14 }}>
          <summary>
            <b>How to measure tricky rooms</b>
          </summary>
          <ul style={{ marginTop: 10 }}>
            <li>Measure only the walls you will actually paint.</li>
            <li>For open-plan areas, ignore the “missing” wall sections (don’t add them).</li>
            <li>Kitchen cabinets can be estimated and subtracted (try 3–8 m² if unsure).</li>
            <li>If you don’t know ceiling height, many homes are around 2.4m.</li>
            <li>Keep waste at ~10% for normal walls, higher for textured surfaces.</li>
          </ul>
        </details>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button className="primary" type="button" onClick={() => setHasCalculated(true)}>
            Calculate
          </button>
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </div>

        {hasCalculated && !parsed.success && (
          <p style={{ marginTop: 12, color: "tomato" }}>
            Please check your inputs — some values are missing or out of range.
          </p>
        )}

        {form.mode === "walls" && form.includeCeiling && (
          <p style={{ marginTop: 10 }}>
            Note: Ceiling calculation currently uses simple room length/width (advanced ceiling support can be added next).
          </p>
        )}
      </section>

      {/* Results */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Results</h2>

        {!hasCalculated ? (
          <p>
            Enter your room details and click <b>Calculate</b>.
          </p>
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

      {/* Shopping list */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Shopping list</h2>

        {result ? (
          <ul style={{ display: "grid", gap: 6, margin: 0, paddingLeft: 18 }}>
            <li>
              Paint: <b>{result.litresRounded.toFixed(1)} L</b>
            </li>
            <li>Roller + tray</li>
            <li>2× brushes (cut-in + trim)</li>
            <li>Painters tape</li>
            <li>Drop sheets / plastic</li>
            <li>Sugar soap / wall cleaner</li>
            <li>Filler + sanding sheets</li>
          </ul>
        ) : (
          <p>Calculate first to generate a shopping list.</p>
        )}
      </section>
    </div>
  );
}
