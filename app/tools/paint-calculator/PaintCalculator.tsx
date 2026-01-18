"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PaintProjectSchema,
  paintDefaults,
  imperialDefaults,
  type PaintFormState,
} from "@/lib/tools/paint/schema";
import { calcPaint } from "@/lib/tools/paint/engine";
import type { UnitSystem, SavedCalculation } from "@/lib/tools/paint/types";
import {
  feetToMeters,
  metersToFeet,
  litersToGallons,
  gallonsToLiters,
  coverageM2PerLToFt2PerGal,
  coverageFt2PerGalToM2PerL,
  m2ToFt2,
} from "@/lib/tools/paint/conversions";
import {
  loadHistory,
  saveCalculation as saveCalc,
  loadCalculationById,
  deleteCalculation as deleteCalc,
  updateCalculation as updateCalc,
} from "@/lib/tools/paint/storage";

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
  minWidth: 0, // important: prevents grid overflow
};

export default function PaintCalculator() {
  const [form, setForm] = useState<PaintFormState>(paintDefaults);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Save/Load state
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [selectedCalcId, setSelectedCalcId] = useState<string>('');
  const [loadedCalcId, setLoadedCalcId] = useState<string>(''); // Track currently loaded calculation
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Track if updating existing
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveError, setSaveError] = useState('');

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [calcToDelete, setCalcToDelete] = useState<string>('');

  // Load unit preference and saved calculations on mount
  useEffect(() => {
    const savedUnit = localStorage.getItem('paint-unit-system') as UnitSystem | null;
    if (savedUnit === 'imperial') {
      setForm(imperialDefaults);
    }
    setSavedCalculations(loadHistory());
  }, []);

  // Convert form values to metric for validation and calculation
  const metricForm = useMemo(() => {
    if (form.unitSystem === 'metric') return form;

    return {
      ...form,
      lengthM: feetToMeters(form.lengthM),
      widthM: feetToMeters(form.widthM),
      heightM: feetToMeters(form.heightM),
      coverageM2PerL: coverageFt2PerGalToM2PerL(form.coverageM2PerL),
      pricePerL: form.pricePerL ? gallonsToLiters(form.pricePerL) : undefined,
    };
  }, [form]);

  const parsed = useMemo(() => PaintProjectSchema.safeParse(metricForm), [metricForm]);

  const result = useMemo(() => {
    if (!hasCalculated) return null;
    if (!parsed.success) return null;
    return calcPaint(parsed.data);
  }, [parsed, hasCalculated]);

  function onReset() {
    setForm(form.unitSystem === 'metric' ? paintDefaults : imperialDefaults);
    setHasCalculated(false);
    setLoadedCalcId(''); // Clear loaded calculation when resetting
  }

  function onUnitSystemChange(newUnit: UnitSystem) {
    if (newUnit === form.unitSystem) return;

    // Convert all values to the new unit system
    const converted: PaintFormState = {
      ...form,
      unitSystem: newUnit,
    };

    if (newUnit === 'imperial') {
      // Convert metric to imperial
      converted.lengthM = Number.isNaN(form.lengthM) ? NaN : metersToFeet(form.lengthM);
      converted.widthM = Number.isNaN(form.widthM) ? NaN : metersToFeet(form.widthM);
      converted.heightM = Number.isNaN(form.heightM) ? NaN : metersToFeet(form.heightM);
      converted.coverageM2PerL = Number.isNaN(form.coverageM2PerL) ? NaN : coverageM2PerLToFt2PerGal(form.coverageM2PerL);
      converted.pricePerL = form.pricePerL && !Number.isNaN(form.pricePerL) ? litersToGallons(form.pricePerL) : form.pricePerL;
    } else {
      // Convert imperial to metric
      converted.lengthM = Number.isNaN(form.lengthM) ? NaN : feetToMeters(form.lengthM);
      converted.widthM = Number.isNaN(form.widthM) ? NaN : feetToMeters(form.widthM);
      converted.heightM = Number.isNaN(form.heightM) ? NaN : feetToMeters(form.heightM);
      converted.coverageM2PerL = Number.isNaN(form.coverageM2PerL) ? NaN : coverageFt2PerGalToM2PerL(form.coverageM2PerL);
      converted.pricePerL = form.pricePerL && !Number.isNaN(form.pricePerL) ? gallonsToLiters(form.pricePerL) : form.pricePerL;
    }

    setForm(converted);
    localStorage.setItem('paint-unit-system', newUnit);
  }

  function onLoadCalculation(calcId: string) {
    if (!calcId) return;

    const saved = loadCalculationById(calcId);
    if (saved) {
      setForm(saved.form);
      setHasCalculated(true);
      setLoadedCalcId(calcId); // Track which calculation is loaded
      setSelectedCalcId(''); // Reset dropdown selection
    }
  }

  function onDeleteCalculation(calcId: string) {
    if (!calcId) return;
    setCalcToDelete(calcId);
    setShowDeleteDialog(true);
  }

  function confirmDelete() {
    if (!calcToDelete) return;

    deleteCalc(calcToDelete);
    setSavedCalculations(loadHistory());
    if (loadedCalcId === calcToDelete) {
      setLoadedCalcId('');
    }

    setShowDeleteDialog(false);
    setCalcToDelete('');
  }

  function onOpenSaveDialog() {
    // If we have a loaded calculation, pre-fill for update
    if (loadedCalcId) {
      const saved = loadCalculationById(loadedCalcId);
      if (saved) {
        setSaveName(saved.name);
        setSaveDescription(saved.description);
        setIsUpdating(true);
      }
    } else {
      setIsUpdating(false);
    }
    setShowSaveDialog(true);
  }

  function onSaveCalculation() {
    // Validate inputs
    if (!saveName.trim()) {
      setSaveError('Please enter a name');
      return;
    }
    if (!saveDescription.trim()) {
      setSaveError('Please enter a description');
      return;
    }
    if (!result) {
      setSaveError('Please calculate first');
      return;
    }

    try {
      if (isUpdating && loadedCalcId) {
        // Update existing calculation
        updateCalc(loadedCalcId, saveName, saveDescription, form, result);
      } else {
        // Save new calculation
        const newCalc = saveCalc(saveName, saveDescription, form, result);
        setLoadedCalcId(newCalc.id); // Track newly saved calculation
      }

      setSavedCalculations(loadHistory());

      // Reset dialog
      setShowSaveDialog(false);
      setSaveName('');
      setSaveDescription('');
      setSaveError('');
      setIsUpdating(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    }
  }

  const isMetric = form.unitSystem === 'metric';
  const lengthLabel = isMetric ? "Length (m)" : "Length (ft)";
  const widthLabel = isMetric ? "Width (m)" : "Width (ft)";
  const heightLabel = isMetric ? "Ceiling height (m)" : "Ceiling height (ft)";
  const coverageLabel = isMetric ? "Coverage (m²/L)" : "Coverage (ft²/gal)";
  const priceLabel = isMetric ? "Price per litre (optional)" : "Price per gallon (optional)";
  const dimensionStep = isMetric ? 0.1 : 0.5;
  const areaUnit = isMetric ? "m²" : "ft²";
  const volumeUnit = isMetric ? "L" : "gal";

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
      {/* Inputs */}
      <section className="card">
        {/* Unit Toggle */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--bg)", borderRadius: 10 }}>
            <button
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 8,
                background: isMetric ? "var(--card)" : "transparent",
                color: isMetric ? "var(--text)" : "var(--muted)",
                fontWeight: isMetric ? 600 : 400,
                cursor: "pointer",
                boxShadow: isMetric ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
              onClick={() => onUnitSystemChange('metric')}
            >
              Metric
            </button>
            <button
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 8,
                background: !isMetric ? "var(--card)" : "transparent",
                color: !isMetric ? "var(--text)" : "var(--muted)",
                fontWeight: !isMetric ? 600 : 400,
                cursor: "pointer",
                boxShadow: !isMetric ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
              onClick={() => onUnitSystemChange('imperial')}
            >
              Imperial
            </button>
          </div>
        </div>

        {/* Load Saved Calculations */}
        {savedCalculations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: "var(--text)", marginBottom: 6, display: "block" }}>
              Load saved calculation
            </label>
            <select
              value={selectedCalcId}
              onChange={(e) => {
                const calcId = e.target.value;
                setSelectedCalcId(calcId);
                if (calcId) {
                  onLoadCalculation(calcId);
                }
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "#fff",
                color: "var(--text)",
                fontSize: 14,
              }}
            >
              <option value="">Select a saved calculation...</option>
              {savedCalculations.map((calc) => (
                <option key={calc.id} value={calc.id}>
                  {calc.name} - {calc.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Currently Loaded Calculation */}
        {loadedCalcId && (() => {
          const loaded = savedCalculations.find(c => c.id === loadedCalcId);
          return loaded ? (
            <div style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(47, 133, 90, 0.08)",
              border: "1px solid rgba(47, 133, 90, 0.2)",
            }}>
              <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600, marginBottom: 4 }}>
                Currently loaded:
              </div>
              <div style={{ fontWeight: 600, color: "var(--text)" }}>
                {loaded.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {loaded.description}
              </div>
            </div>
          ) : null;
        })()}

        <h2 style={{ marginTop: 0 }}>Room details</h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            alignItems: "start",
          }}
        >
          <label style={fieldLabelStyle}>
            {lengthLabel}
            <input
              type="number"
              step={dimensionStep}
              value={Number.isNaN(form.lengthM) ? "" : form.lengthM}
              onChange={(e) =>
                setForm({ ...form, lengthM: toNumber(e.target.value) })
              }
            />
          </label>

          <label style={fieldLabelStyle}>
            {widthLabel}
            <input
              type="number"
              step={dimensionStep}
              value={Number.isNaN(form.widthM) ? "" : form.widthM}
              onChange={(e) =>
                setForm({ ...form, widthM: toNumber(e.target.value) })
              }
            />
          </label>

          <label style={fieldLabelStyle}>
            {heightLabel}
            <input
              type="number"
              step={dimensionStep}
              value={Number.isNaN(form.heightM) ? "" : form.heightM}
              onChange={(e) =>
                setForm({ ...form, heightM: toNumber(e.target.value) })
              }
            />
          </label>

          <label style={fieldLabelStyle}>
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
            />
          </label>

          <label style={fieldLabelStyle}>
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
            {coverageLabel}
            <input
              type="number"
              step={isMetric ? 0.5 : 10}
              value={
                Number.isNaN(form.coverageM2PerL) ? "" : form.coverageM2PerL
              }
              onChange={(e) =>
                setForm({ ...form, coverageM2PerL: toNumber(e.target.value) })
              }
            />
          </label>

          <label style={fieldLabelStyle}>
            Waste (%)
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.wastePct) ? "" : form.wastePct}
              onChange={(e) =>
                setForm({ ...form, wastePct: toNumber(e.target.value) })
              }
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center", paddingTop: 26 }}>
            <input
              type="checkbox"
              checked={form.includeCeiling}
              onChange={(e) =>
                setForm({ ...form, includeCeiling: e.target.checked })
              }
            />
            Include ceiling
          </label>

          <label style={fieldLabelStyle}>
            {priceLabel}
            <input
              type="number"
              step="0.5"
              value={form.pricePerL ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  pricePerL:
                    e.target.value.trim() === ""
                      ? undefined
                      : toNumber(e.target.value),
                })
              }
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button className="primary" onClick={() => setHasCalculated(true)}>
            Calculate
          </button>

          <button onClick={onReset}>Reset</button>

          {result && (
            <>
              <button className="primary" onClick={onOpenSaveDialog}>
                {loadedCalcId ? 'Update Calculation' : 'Save Calculation'}
              </button>
              {loadedCalcId && (
                <>
                  <button onClick={() => {
                    setLoadedCalcId('');
                    setShowSaveDialog(true);
                    setIsUpdating(false);
                    setSaveName('');
                    setSaveDescription('');
                  }}>
                    Save as New
                  </button>
                  <button
                    onClick={() => onDeleteCalculation(loadedCalcId)}
                    style={{ color: "#dc2626" }}
                  >
                    Delete
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {hasCalculated && !parsed.success && (
          <p style={{ marginTop: 12, color: "tomato" }}>
            Please check your inputs — some values are missing or out of range.
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
              Paintable area: <b>
                {isMetric
                  ? `${result.paintableAreaM2.toFixed(1)} ${areaUnit}`
                  : `${m2ToFt2(result.paintableAreaM2).toFixed(1)} ${areaUnit}`
                }
              </b>
            </div>
            <div>
              {isMetric ? "Litres" : "Gallons"} (raw): {isMetric
                ? `${result.litresRaw.toFixed(2)} ${volumeUnit}`
                : `${litersToGallons(result.litresRaw).toFixed(2)} ${volumeUnit}`
              }
            </div>
            <div>
              {isMetric ? "Litres" : "Gallons"} (with waste): {isMetric
                ? `${result.litresWithWaste.toFixed(2)} ${volumeUnit}`
                : `${litersToGallons(result.litresWithWaste).toFixed(2)} ${volumeUnit}`
              }
            </div>
            <div>
              Recommended to buy: <b>
                {isMetric
                  ? `${result.litresRounded.toFixed(1)} ${volumeUnit}`
                  : `${litersToGallons(result.litresRounded).toFixed(1)} ${volumeUnit}`
                }
              </b>
            </div>
            <div>
              Suggested cans:{" "}
              <b>
                {result.recommendedCans
                  .map((c) => `${c.qty}×${c.sizeL}L`)
                  .join(", ")}
              </b>
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
              Paint: <b>
                {isMetric
                  ? `${result.litresRounded.toFixed(1)} ${volumeUnit}`
                  : `${litersToGallons(result.litresRounded).toFixed(1)} ${volumeUnit}`
                }
              </b>
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

      {/* Save Dialog */}
      {showSaveDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 500, width: "90%", margin: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>
              {isUpdating ? 'Update Calculation' : 'Save Calculation'}
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={fieldLabelStyle}>
                Name
                <input
                  type="text"
                  placeholder="e.g., Living Room"
                  maxLength={50}
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </label>

              <label style={fieldLabelStyle}>
                Description
                <input
                  type="text"
                  placeholder="e.g., Main floor repaint"
                  maxLength={100}
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                />
              </label>

              {saveError && (
                <p style={{ color: "tomato", margin: 0 }}>{saveError}</p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="primary" onClick={onSaveCalculation}>
                  {isUpdating ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName('');
                    setSaveDescription('');
                    setSaveError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (() => {
        const calcToDeleteData = savedCalculations.find(c => c.id === calcToDelete);
        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => {
              setShowDeleteDialog(false);
              setCalcToDelete('');
            }}
          >
            <div
              className="card"
              style={{ maxWidth: 450, width: "90%", margin: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, color: "#dc2626" }}>Delete Calculation?</h2>

              <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
                Are you sure you want to delete this calculation? This action cannot be undone.
              </p>

              {calcToDeleteData && (
                <div style={{
                  padding: "12px",
                  borderRadius: 8,
                  background: "var(--bg)",
                  marginBottom: 16,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {calcToDeleteData.name}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {calcToDeleteData.description}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #dc2626",
                    background: "#dc2626",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setCalcToDelete('');
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
