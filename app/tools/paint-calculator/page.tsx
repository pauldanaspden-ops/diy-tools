import PaintCalculator from "./PaintCalculator";

export default function Page() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1>Paint Calculator</h1>
      <p>Calculate how much paint you need for a room.</p>
      <PaintCalculator />
    </main>
  );
}
