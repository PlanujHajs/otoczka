"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertCircle, Trash2, Edit2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface Point {
  id: string;
  x: number;
  y: number;
}

export function ConvexHullCalculator() {
  const [points, setPoints] = useState<Point[]>([]);
  const [newX, setNewX] = useState<string>("");
  const [newY, setNewY] = useState<string>("");
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hullPoints, setHullPoints] = useState<Point[]>([]);
  const [hullType, setHullType] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Obliczanie otoczki przy każdej zmianie punktów
  useEffect(() => {
    if (points.length > 0) {
      const hull = calculateConvexHull(points);
      setHullPoints(hull);
      determineHullType(hull);
    } else {
      setHullPoints([]);
      setHullType("");
    }
  }, [points]);

  // Odśwież canvas po każdej zmianie punktów i otoczki
  useEffect(() => {
    drawCanvas();
  }, [points, hullPoints]);

  // Obsługa zmiany rozmiaru okna dla responsywnego canvasu
  useEffect(() => {
    const handleResize = () => {
      drawCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [points, hullPoints]);

  const validPoint = (newX: string, newY: string): null | Point => {
    if (!newX.trim() || !newY.trim()) {
      setError("Wymagane są obie współrzędne X i Y");
      return null;
    }

    const x = Number.parseFloat(newX);
    const y = Number.parseFloat(newY);

    if (isNaN(x) || isNaN(y)) {
      setError("Współrzędne muszą być prawidłowymi liczbami");
      return null;
    }

    return {
      id: Date.now().toString(),
      x,
      y,
    };
  };

  const addPoint = () => {
    const newPoint = validPoint(newX, newY);
    if (!newPoint) return;

    setPoints([...points, newPoint]);
    setNewX("");
    setNewY("");
    setError(null);
  };

  const startEditing = (point: Point) => {
    setEditingPoint(point.id);
    setNewX(point.x.toString());
    setNewY(point.y.toString());
  };

  const saveEdit = () => {
    if (!editingPoint) return;

    const newPoint = validPoint(newX, newY);
    if (!newPoint) return;

    const x = newPoint.x;
    const y = newPoint.y;

    setPoints(points.map((p) => (p.id === editingPoint ? { ...p, x, y } : p)));

    setEditingPoint(null);
    setNewX("");
    setNewY("");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingPoint(null);
    setNewX("");
    setNewY("");
    setError(null);
  };

  const deletePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id));
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Responsywność canvasu
    const container = canvas.parentElement;
    if (container) {
      canvas.width = 600;
      canvas.height = 600;
    }

    // Tutaj sobie rysujemy na canvasie siatkę XY
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= canvas.width; i += 20) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
    }
    for (let i = 0; i <= canvas.height; i += 20) {
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
    }
    ctx.stroke();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    ctx.fillText("X", canvas.width - 20, canvas.height / 2 + 15);
    ctx.fillText("Y", canvas.width / 2 + 5, 20);
    ctx.fillText("0", canvas.width / 2 + 5, canvas.height / 2 + 15);

    // A tutaj na siatce pozycje -200 i 200 dla X i Y
    ctx.fillStyle = "#000000";
    ctx.fillText("-200", 85, 325);
    ctx.fillText("200", 485, 325);
    ctx.fillText("200", 315, 124);
    ctx.fillText("-200", 315, 484);

    // A tutaj są linie pomocnicze do 200, -200 dla X i Y
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 300);
    ctx.lineTo(100, 310);

    ctx.moveTo(500, 300);
    ctx.lineTo(500, 310);

    ctx.moveTo(300, 120);
    ctx.lineTo(310, 120);

    ctx.moveTo(300, 480);
    ctx.lineTo(310, 480);
    ctx.stroke();

    // Jeżeli nie ma punktów, to nic nie rysujemy
    if (points.length === 0) return;

    // Rysowanie punktów
    const hullPointColor = "#6366F1";
    const nonHullPointColor = "#ff0000";
    points.forEach((point) => {
      // Rysujemy punkciki czerwone jak są wewnętrzne, a fioletowe jak są na otoczce
      ctx.fillStyle = hullPoints.some((p) => p.x === point.x && p.y === point.y)
        ? hullPointColor
        : nonHullPointColor;

      ctx.beginPath();
      ctx.arc(point.x + 300, point.y * -1 + 300, 5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // A tutaj rysowanie otoczki wypukłej
    if (hullPoints.length > 1) {
      ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hullPoints[0].x + 300, hullPoints[0].y * -1 + 300);
      hullPoints.forEach((point) => {
        ctx.lineTo(point.x + 300, point.y * -1 + 300);
      });
      ctx.closePath();
      ctx.stroke();
    }
  };

  const calculateConvexHull = (points: Point[]): Point[] => {
    if (points.length <= 2) return points;

    // Step 1: Sortowanie punktów na osi X oraz Y jak jest równa X
    const sortedPoints = [...points].sort((a, b) =>
      a.x === b.x ? a.y - b.y : a.x - b.x
    );

    // Step 2: Budujemy donly hull
    const lowerHull: Point[] = [];
    for (const point of sortedPoints) {
      while (
        lowerHull.length >= 2 &&
        crossProduct(
          lowerHull[lowerHull.length - 2],
          lowerHull[lowerHull.length - 1],
          point
        ) <= 0
      ) {
        lowerHull.pop();
      }
      lowerHull.push(point);
    }

    // Step 3: Budujemy górny hull
    const upperHull: Point[] = [];
    for (let i = sortedPoints.length - 1; i >= 0; i--) {
      const point = sortedPoints[i];
      while (
        upperHull.length >= 2 &&
        crossProduct(
          upperHull[upperHull.length - 2],
          upperHull[upperHull.length - 1],
          point
        ) <= 0
      ) {
        upperHull.pop();
      }
      upperHull.push(point);
    }

    // Step 4: Kasujemy duplikat punktu (ostatni punkt się duplikuje)
    upperHull.pop();
    lowerHull.pop();

    // Step 5: i końcowo łączymy dolny i górny hull i mamy convexHull
    return lowerHull.concat(upperHull);
  };

  // Funkcja do obliczania iloczynu wektorowego między trzema punktami
  const crossProduct = (p1: Point, p2: Point, p3: Point): number => {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  };

  const determineHullType = (hull: Point[]) => {
    const hullTypes = {
      0: "Brak otoczki (pusty zbiór)",
      1: "Punkt",
      2: "Odcinek",
      3: "Trójkąt",
      4: "Czworokąt",
    };

    setHullType(
      hullTypes[hull.length as keyof typeof hullTypes] ||
        `Wielokąt (${hull.length} wierzchołków)`
    );
  };

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
                <Label htmlFor="x-coordinate">
                  Współrzędna X (od -300 do 300)
                </Label>
                <Input
                  id="x-coordinate"
                  type="number"
                  step="any"
                  value={newX}
                  onChange={(e) => {
                    // walidacja X dla -300 i 300
                    // Jak nie ma minusa to max 3 znaki
                    if (e.target.value.length > 3 && e.target.value[0] !== "-")
                      return;
                    // Jak jest minus to max 4 znaki
                    if (e.target.value.length > 4 && e.target.value[0] === "-")
                      return;
                    setError(null);
                    if (e.target.value.length > 0) {
                      const x = Number.parseFloat(e.target.value);
                      if (x < -300 || x > 300) {
                        setError(
                          "Współrzędna X musi być w zakresie -300 do 300"
                        );
                      }
                    }
                    return setNewX(e.target.value);
                  }}
                  placeholder="X"
                />
              </div>
              <div>
                <Label htmlFor="y-coordinate">
                  Współrzędna Y (od -300 do 300)
                </Label>
                <Input
                  id="y-coordinate"
                  type="number"
                  step="any"
                  value={newY}
                  onChange={(e) => {
                    // ta sama walidacja co wyżej
                    if (e.target.value.length > 3 && e.target.value[0] !== "-")
                      return;
                    if (e.target.value.length > 4 && e.target.value[0] === "-")
                      return;
                    setError(null);
                    if (e.target.value.length > 0) {
                      const y = Number.parseFloat(e.target.value);
                      if (y < -300 || y > 300) {
                        setError(
                          "Współrzędna Y musi być w zakresie -300 do 300"
                        );
                      }
                    }
                    return setNewY(e.target.value);
                  }}
                  placeholder="Y"
                />
              </div>
            </div>

            {editingPoint ? (
              <div className="flex space-x-2">
                <Button
                  onClick={saveEdit}
                  disabled={!!error}
                  className="flex-1"
                >
                  Zapisz zmiany
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  className="flex-1"
                >
                  Anuluj
                </Button>
              </div>
            ) : (
              <Button disabled={!!error} onClick={addPoint} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Dodaj punkt
              </Button>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Lista punktów</h3>
            {points.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nie dodano jeszcze żadnych punktów
              </p>
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
            <canvas
              ref={canvasRef}
              style={{ minHeight: "150px", minWidth: "150px" }}
              className="w-full h-full"
            ></canvas>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">
              Wyniki otoczki wypukłej
            </h3>

            {points.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Dodaj punkty, aby obliczyć otoczkę wypukłą
              </p>
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
  );
}
