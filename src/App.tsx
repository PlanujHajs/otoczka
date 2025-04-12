import { ConvexHullCalculator } from "./components/convex-hull-calculator"

export function App() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-800">Kalkulator Otoczki Wypukłej</h1>
        <ConvexHullCalculator />
      </div>
    </main>
  )
}
