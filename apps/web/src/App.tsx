import { Button } from "@/components/ui/button";

export function App() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <section
        className="w-full max-w-3xl rounded-lg border bg-card p-8 text-card-foreground shadow-sm"
        aria-labelledby="app-title"
      >
        <p className="mb-3 text-sm font-semibold text-emerald-700">
          Weather intelligence for field operations
        </p>
        <h1 id="app-title" className="text-4xl font-bold tracking-normal">
          WeatherOps Lite
        </h1>
        <p className="mt-4 max-w-prose text-base leading-7 text-muted-foreground">
          A focused dashboard foundation for turning WeatherAI data into risk
          scores, saved location checks, and operational recommendations.
        </p>
        <div className="mt-6">
          <Button type="button">ShadCN foundation ready</Button>
        </div>
      </section>
    </main>
  );
}

export default App;
