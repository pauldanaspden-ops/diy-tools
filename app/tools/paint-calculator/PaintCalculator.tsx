"use client";

import { useMemo, useState } from "react";
import { PaintProjectSchema, paintDefaults } from "@/lib/tools/paint/schema";
import { calcPaint } from "@/lib/tools/paint/engine";

export default function PaintCalculator() {
  const [form] = useState(paintDefaults);

  const parsed = useMemo(() => PaintProjectSchema.safeParse(form), [form]);
  const result = useMemo(() => (parsed.success ? calcPaint(parsed.data) : null), [parsed]);

  return (
    <div style={{ marginTop: 16 }}>
      {result ? (
        <div>
          <p><b>Paintable area:</b> {result.paintableAreaM2.toFixed(1)} m²</p>
          <p><b>Paint to buy:</b> {result.litresRounded.toFixed(1)} L</p>
        </div>
      ) : (
        <p>Inputs invalid.</p>
      )}
    </div>
  );
}
