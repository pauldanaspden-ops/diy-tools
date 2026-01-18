import PaintCalculator from "./PaintCalculator";

export const metadata = {
  title: "Paint Calculator – How Much Paint Do I Need? | Free Tool",
  description:
    "Free paint calculator with metric/imperial units. Calculate how many litres or gallons of paint you need for any room. Save calculations and get accurate estimates including waste.",
  keywords: "paint calculator, how much paint do I need, paint estimator, room paint calculator, paint coverage calculator, litres of paint, gallons of paint",
  openGraph: {
    title: "Paint Calculator – How Much Paint Do I Need?",
    description: "Free paint calculator to work out exactly how much paint you need for a room",
    type: "website",
  },
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
