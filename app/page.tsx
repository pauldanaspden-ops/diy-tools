export default function Home() {
  return (
    <main className="container">
      <h1>DIY Tools</h1>
      <p>Simple calculators and planners for common home DIY tasks.</p>

      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Paint Calculator</h2>
            <p style={{ marginBottom: 0 }}>Work out how much paint you need, including waste.</p>
          </div>
          <a href="/tools/paint-calculator">Open →</a>
        </div>
      </section>
    </main>
  );
}
