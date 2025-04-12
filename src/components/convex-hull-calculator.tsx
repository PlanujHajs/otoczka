"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { AlertCircle, Trash2, Edit2, Plus } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"

interface Point {
  id: string
  x: number
  y: number
}

export function ConvexHullCalculator() {
  const [points, setPoints] = useState<Point[]>([])
  const [newX, setNewX] = useState<string>("")
  const [newY, setNewY] = useState<string>("")
  const [editingPoint, setEditingPoint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hullPoints, setHullPoints] = useState<Point[]>([])
  const [hullType, setHullType] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Obliczanie otoczki przy każdej zmianie punktów
  useEffect(() => {
    if (points.length > 0) {
      const hull = calculateConvexHull(points)
      setHullPoints(hull)
      determineHullType(hull)
    } else {
      setHullPoints([])
      setHullType("")
    }
  }, [points])

  // Odśwież canvas po każdej zmianie punktów i otoczki
  useEffect(() => {
    drawCanvas()
  }, [points, hullPoints])

  // Obsługa zmiany rozmiaru okna dla responsywnego canvasu
  useEffect(() => {
    const handleResize = () => {
      drawCanvas()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [points, hullPoints])

  const validPoint = (newX: string, newY: string): null|Point => {
    if (!newX.trim() || !newY.trim()) {
      setError("Wymagane są obie współrzędne X i Y")
      return null
    }

    const x = Number.parseFloat(newX)
    const y = Number.parseFloat(newY)

    if (isNaN(x) || isNaN(y)) {
      setError("Współrzędne muszą być prawidłowymi liczbami")
      return null
    }

    return {
      id: Date.now().toString(),
      x,
      y,
    }
  }

  const addPoint = () => {
    const newPoint = validPoint(newX, newY)
    if (!newPoint) return

    setPoints([...points, newPoint])
    setNewX("")
    setNewY("")
    setError(null)
  }

  const startEditing = (point: Point) => {
    setEditingPoint(point.id)
    setNewX(point.x.toString())
    setNewY(point.y.toString())
  }

  const saveEdit = () => {
    if (!editingPoint) return

    const newPoint = validPoint(newX, newY)
    if (!newPoint) return

    const x = newPoint.x
    const y = newPoint.y

    setPoints(points.map((p) => (p.id === editingPoint ? { ...p, x, y } : p)))

    setEditingPoint(null)
    setNewX("")
    setNewY("")
    setError(null)
  }

  const cancelEdit = () => {
    setEditingPoint(null)
    setNewX("")
    setNewY("")
    setError(null)
  }

  const deletePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id))
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Responsywność canvasu
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.clientWidth
      canvas.height = Math.min(400, window.innerHeight * 0.5)
    }

    // Czyszczenie canvasu
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Jestli nie ma współrzędnych punktów, to nic nie rysujemy
    if (points.length === 0) return

    // TODO: Rysowanie punktów
    ctx.fillStyle = "#6366F1"
    points.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const calculateConvexHull = (points: Point[]): Point[] => {
    if (points.length <= 2) return points

    // TODO: Algorytm Grahama dla wyszukania otoczki

    // return hullPoints
    return points
  }

  const determineHullType = (hull: Point[]) => {
    const hullTypes = {
      0: "Brak otoczki (pusty zbiór)",
      1: "Punkt",
      2: "Odcinek",
      3: "Trójkąt",
      4: "Czworokąt"
    };

    setHullType(
      hullTypes[hull.length as keyof typeof hullTypes] ||
      `Wielokąt (${hull.length} wierzchołków)`
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Wprowadź punkty</h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="x-coordinate">Współrzędna X</Label>
                <Input
                  id="x-coordinate"
                  type="number"
                  step="any"
                  value={newX}
                  onChange={(e) => setNewX(e.target.value)}
                  placeholder="X"
                />
              </div>
              <div>
                <Label htmlFor="y-coordinate">Współrzędna Y</Label>
                <Input
                  id="y-coordinate"
                  type="number"
                  step="any"
                  value={newY}
                  onChange={(e) => setNewY(e.target.value)}
                  placeholder="Y"
                />
              </div>
            </div>

            {editingPoint ? (
              <div className="flex space-x-2">
                <Button onClick={saveEdit} className="flex-1">
                  Zapisz zmiany
                </Button>
                <Button variant="outline" onClick={cancelEdit} className="flex-1">
                  Anuluj
                </Button>
              </div>
            ) : (
              <Button onClick={addPoint} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Dodaj punkt
              </Button>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Lista punktów</h3>
            {points.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nie dodano jeszcze żadnych punktów</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">X</th>
                      <th className="py-2 text-left">Y</th>
                      <th className="py-2 text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((point) => (
                      <tr key={point.id} className="border-b">
                        <td className="py-2">{point.x}</td>
                        <td className="py-2">{point.y}</td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(point)}
                              disabled={!!editingPoint}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePoint(point.id)}
                              disabled={!!editingPoint}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Wizualizacja</h2>
          <div className="border rounded-md bg-white">
            <canvas ref={canvasRef} className="w-full" style={{ minHeight: "300px" }}></canvas>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Wyniki otoczki wypukłej</h3>

            {points.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Dodaj punkty, aby obliczyć otoczkę wypukłą</p>
            ) : (
              <>
                <div className="mb-4">
                  <strong>Typ otoczki:</strong> {hullType}
                </div>

                {hullPoints.length > 0 && (
                  <div>
                    <strong>Wierzchołki otoczki:</strong>
                    <div className="mt-2 max-h-[150px] overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 text-left">X</th>
                            <th className="py-2 text-left">Y</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hullPoints.map((point, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">{point.x}</td>
                              <td className="py-2">{point.y}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
