import PaintCalculator from "./PaintCalculator";

export const metadata = {
  title: "Paint Calculator – How Much Paint Do I Need?",
  description:
    "Free paint calculator to work out how many litres of paint you need for a room, including waste.",
};

export default function Page() {
  return (
    <main className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1>Paint Calculator</h1>
          <p>Calculate how much paint you need for a room.</p>
        </div>
        <a className="badge" href="/">← Back to tools</a>
      </div>

      <PaintCalculator />
      <p style={{ marginTop: 16, fontSize: 12 }}>
        Disclaimer: This tool provides estimates only. Always check product coverage on the tin.
      </p>
    </main>
  );
}
