import type { PaintFormState } from "./schema";
import type { PaintProjectResult } from "./types";

const HISTORY_KEY = "paint-calculation-history";
const MAX_CALCULATIONS = 10;

export type SavedCalculation = {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  form: PaintFormState;
  result: PaintProjectResult;
};

/**
 * Load all saved calculations from localStorage
 */
export function loadHistory(): SavedCalculation[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // Sort by timestamp descending (newest first)
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error loading calculation history:", error);
    return [];
  }
}

/**
 * Save a new calculation to localStorage
 * Enforces 10-item limit by removing oldest when exceeded
 */
export function saveCalculation(
  name: string,
  description: string,
  form: PaintFormState,
  result: PaintProjectResult
): SavedCalculation {
  try {
    const history = loadHistory();

    const newCalculation: SavedCalculation = {
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 50),
      description: description.trim().slice(0, 100),
      timestamp: Date.now(),
      form,
      result,
    };

    // Add new calculation
    history.unshift(newCalculation);

    // Enforce max limit (remove oldest if exceeded)
    if (history.length > MAX_CALCULATIONS) {
      history.length = MAX_CALCULATIONS;
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return newCalculation;
  } catch (error) {
    console.error("Error saving calculation:", error);
    throw new Error("Failed to save calculation. Storage may be full.");
  }
}

/**
 * Load a specific calculation by ID
 */
export function loadCalculationById(id: string): SavedCalculation | null {
  const history = loadHistory();
  return history.find((calc) => calc.id === id) || null;
}

/**
 * Update an existing calculation
 */
export function updateCalculation(
  id: string,
  name: string,
  description: string,
  form: PaintFormState,
  result: PaintProjectResult
): SavedCalculation | null {
  try {
    const history = loadHistory();
    const index = history.findIndex((calc) => calc.id === id);

    if (index === -1) return null;

    const updated: SavedCalculation = {
      ...history[index],
      name: name.trim().slice(0, 50),
      description: description.trim().slice(0, 100),
      timestamp: Date.now(),
      form,
      result,
    };

    history[index] = updated;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return updated;
  } catch (error) {
    console.error("Error updating calculation:", error);
    throw new Error("Failed to update calculation.");
  }
}

/**
 * Delete a calculation from history
 */
export function deleteCalculation(id: string): void {
  try {
    const history = loadHistory();
    const filtered = history.filter((calc) => calc.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting calculation:", error);
    throw new Error("Failed to delete calculation.");
  }
}

/**
 * Clear all saved calculations
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing history:", error);
  }
}
