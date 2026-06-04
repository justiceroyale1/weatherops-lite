import "./styles.css";

export function App() {
  return (
    <main className="app-shell">
      <section className="intro-panel" aria-labelledby="app-title">
        <p className="eyebrow">Weather intelligence for field operations</p>
        <h1 id="app-title">WeatherOps Lite</h1>
        <p className="summary">
          A focused dashboard foundation for turning WeatherAI data into risk
          scores, saved location checks, and operational recommendations.
        </p>
      </section>
    </main>
  );
}

export default App;
