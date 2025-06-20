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

/**
 * Oblicza iloczyn wektorowy (a->b) × (a->c)
 * @param a - Punkt początkowy
 * @param b - Pierwszy punkt końcowy
 * @param c - Drugi punkt końcowy
 * @returns Wartość iloczynu wektorowego: dodatnia dla lewego skrętu, ujemna dla prawego, 0 dla punktów współliniowych
 */
export const crossProduct = (a: Point, b: Point, c: Point): number =>
  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/**
 * Oblicza punkty otoczki wypukłej zbioru punktów stosując algorytm Grahama
 * @param points - Tablica punktów do analizy
 * @returns Tablica punktów tworzących otoczkę wypukłą
 */
export const calculateConvexHull = (points: Point[]): Point[] => {
  // 1. Sprawdzamy, czy mamy wystarczająco punktów, jak nie to zwracamy wszystkie
  if (points.length < 3) return points;

  /* 2. Wyszukiwanie punktu P0 o najniższej wartości współrzędnej y,
        a w przypadku takiej samej wartości y, wybieramy punkt o najmniejszym x */
  const pointO = points.reduce(
    (best, p) => (p.y < best.y || (p.y === best.y && p.x < best.x) ? p : best),
    points[0]
  );

  /* 3. Sortowanie pozostałych punktów (poza P0) rosnąco według kąta względem P0,
          a przy tych samych kątach - według odległości od P0 (malejąco) */
  const sorted = points
    .filter((p) => p !== pointO)
    .sort((a, b) => {
      const angA = Math.atan2(a.y - pointO.y, a.x - pointO.x);
      const angB = Math.atan2(b.y - pointO.y, b.x - pointO.x);
      if (angA !== angB) return angA - angB; // sortujemy po kącie
      const dA = (a.x - pointO.x) ** 2 + (a.y - pointO.y) ** 2;
      const dB = (b.x - pointO.x) ** 2 + (b.y - pointO.y) ** 2;
      return dA - dB; // sortujemy po odległości
    });

  /* 4. Inicjalizacja stosu - dodajemy punkt P0 */
  const hull: Point[] = [pointO];
  const top = () => hull[hull.length - 1]; // funkcja pomocnicza - wierzchołek stosu
  const nextTop = () => hull[hull.length - 2]; // funkcja pomocnicza - przedostatni element stosu

  /* 5. Skanowanie punktów i budowanie otoczki */
  for (const p of sorted) {
    // 5.1 Usuwamy punkty, które nie tworzą lewoskrętu
    while (
      hull.length >= 2 &&
      crossProduct(nextTop(), top(), p) <= 0 // prawy skręt lub linia prosta
    ) {
      hull.pop(); // usuwamy punkt z góry stosu
    }
    // 5.2 Dodajemy bieżący punkt na stos
    hull.push(p);
  }

  // 6. Zwracamy zawartość stosu (otoczkę wypukłą)
  return hull;
};

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

  /**
   * Waliduje wprowadzone współrzędne i tworzy nowy punkt
   * @param newX - Wartość współrzędnej X jako string
   * @param newY - Wartość współrzędnej Y jako string
   * @returns Obiekt punktu lub null jeśli dane są nieprawidłowe
   */
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

    // Sprawdzenie, czy punkt o takich współrzędnych już istnieje
    const pointExists = points.some(
      (p) =>
        p.x === x &&
        p.y === y &&
        // Jeśli edytujemy punkt, ignorujemy sprawdzanie tego punktu
        (editingPoint ? p.id !== editingPoint : true)
    );

    if (pointExists) {
      setError("Punkt o podanych współrzędnych już istnieje");
      return null;
    }

    return {
      id: Date.now().toString(),
      x,
      y,
    };
  };

  /**
   * Dodaje nowy punkt do zbioru, jeżeli poprany
   */
  const addPoint = () => {
    const newPoint = validPoint(newX, newY);
    if (!newPoint) return;

    setPoints([...points, newPoint]);
    setNewX("");
    setNewY("");
    setError(null);
  };

  /**
   * Rozpoczyna edycję istniejącego punktu
   * @param point - Punkt, który będzie edytowany
   */
  const startEditing = (point: Point) => {
    setEditingPoint(point.id);
    setNewX(point.x.toString());
    setNewY(point.y.toString());
  };

  /**
   * Zapisuje zmiany w edytowanym punkcie
   */
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

  /**
   * Anuluje edycję punktu i czyści formularz
   */
  const cancelEdit = () => {
    setEditingPoint(null);
    setNewX("");
    setNewY("");
    setError(null);
  };

  /**
   * Usuwa punkt o podanym ID
   * @param id - ID punktu do usunięcia
   */
  const deletePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id));
  };

  /**
   * Oblicza skalę do rysowania na podstawie maksymalnej współrzędnej z 10% marginesem
   * @param canvas - Element canvas do rysowania
   * @param maxCoord - Maksymalna wartość bezwzględna współrzędnej wśród punktów
   * @returns Współczynnik skalowania do przekształcania współrzędnych na piksele
   */
  const getScale = (canvas: HTMLCanvasElement, maxCoord: number) => {
    const margin = 1.1; // 10 % marginesu
    return canvas.width / 2 / (maxCoord * margin);
  };

  /**
   * Zwraca "ładny" krok podziałki dla siatki - wybiera wartość z wybranych ładnych kroków (1, 2, 5) * 10^n
   * @param maxCoord - Maksymalna wartość współrzędnej punktu
   * @returns Wartość kroku podziałki dla siatki i etykiet
   */
  const getNiceStep = (maxCoord: number) => {
    const desiredDivisions = 10;
    const rawStep = maxCoord / desiredDivisions;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));

    const niceValues = [1, 2, 5];

    for (const value of niceValues) {
      const candidate = value * magnitude;
      if (rawStep <= candidate) {
        return candidate;
      }
    }

    return 10 * magnitude;
  };

  /**
   * Rysuje układ współrzędnych, siatkę, punkty i otoczkę wypukłą na elemencie canvas
   */
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 600;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxCoord = getMaxPoint(points);
    const scale = getScale(canvas, maxCoord);
    const step = getNiceStep(maxCoord);
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const maxRange = Math.ceil(maxCoord / step) * step;

    const drawLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      bold = false
    ) => {
      ctx.lineWidth = bold ? 1.5 : 0.5;
      ctx.strokeStyle = bold ? "#d3d3d3" : "#e0e0e0";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    for (let v = -maxRange; v <= maxRange; v += step) {
      if (Math.abs(v) > maxCoord * 1.2) continue;

      const pixel = v * scale;
      const stepIndex = Math.round(v / step);
      const isMajorLine = stepIndex % 5 === 0;

      // Rysujemy linie, tylko jeśli są w obszarze canvas
      if (Math.abs(pixel) <= canvas.width / 2) {
        // Pionowe linie
        drawLine(
          center.x + pixel,
          0,
          center.x + pixel,
          canvas.height,
          isMajorLine
        );
        // Poziome linie
        drawLine(
          0,
          center.y - pixel,
          canvas.width,
          center.y - pixel,
          isMajorLine
        );
      }
    }

    // Etykiety
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";

    const minLabelDistance = 20;
    const drawnLabels = new Set();

    for (let v = -maxRange; v <= maxRange; v += step) {
      if (Math.abs(v) > maxCoord * 1.2) continue;

      const pixel = v * scale;
      const stepIndex = Math.round(v / step);
      const isMajorLine = stepIndex % 5 === 0; // Co piąta linia jest główną

      // Rysujemy etykiety tylko dla linii głównych i pomijamy środek
      if (isMajorLine && v !== 0 && Math.abs(pixel) <= canvas.width / 2) {
        // Sprawdzamy, czy etykieta nie będzie za blisko innych
        const labelKey = `${Math.round(pixel)}`;
        if (
          !drawnLabels.has(labelKey) &&
          Math.abs(pixel) > minLabelDistance / 2
        ) {
          // Etykiety X
          const xLabelY = center.y + 18;
          if (xLabelY < canvas.height - 5) {
            ctx.fillText(String(v), center.x + pixel, xLabelY);
          }

          // Etykiety Y
          const yLabelX = center.x - 18;
          if (yLabelX > 5) {
            ctx.fillText(String(v), yLabelX, center.y - pixel);
          }

          drawnLabels.add(labelKey);
        }
      }
    }

    // Osie główne
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, center.y);
    ctx.lineTo(canvas.width, center.y);
    ctx.moveTo(center.x, 0);
    ctx.lineTo(center.x, canvas.height);
    ctx.stroke();

    // Etykiety osi
    ctx.fillText("X", canvas.width - 15, center.y + 15);
    ctx.fillText("Y", center.x + 15, 15);
    ctx.fillText("0", center.x + 15, center.y + 15);

    // Rysowanie punktów - czerwone jak są wewnętrzne, a fioletowe jak są na otoczce
    const hullPointColor = "#6366F1";
    const nonHullColor = "#ff0000";

    points.forEach((p) => {
      ctx.fillStyle = hullPoints.some((h) => h.x === p.x && h.y === p.y)
        ? hullPointColor
        : nonHullColor;

      ctx.beginPath();
      ctx.arc(
        center.x + p.x * scale,
        center.y - p.y * scale,
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });

    // Otoczka wypukła
    if (hullPoints.length > 1) {
      ctx.strokeStyle = "rgba(99,102,241,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        center.x + hullPoints[0].x * scale,
        center.y - hullPoints[0].y * scale
      );

      hullPoints.forEach((pt) => {
        ctx.lineTo(center.x + pt.x * scale, center.y - pt.y * scale);
      });
      ctx.closePath();
      ctx.stroke();
    }
  };

  /**
   * Określa typ otoczki wypukłej na podstawie liczby wierzchołków
   … (kontynuacja kodu bez zmian) …
   */
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

  /**
   * Znajduje największą wartość bezwzględną współrzędnej punktu w zbiorze
   * @param points - Tablica punktów do analizy
   * @returns Maksymalna wartość bezwzględna współrzędnej zaokrąglona w górę
   */
  const getMaxPoint = (points: Point[]): number => {
    const maxPoint = points.reduce((max, point) => {
      const pointValue = Math.max(Math.abs(point.x), Math.abs(point.y));
      return Math.max(max, pointValue);
    }, 10);

    return Math.ceil(maxPoint);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Wprowadź punkty</h2>

          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="x-coordinate">Współrzędna X</Label>
                <Input
                  id="x-coordinate"
                  type="number"
                  step="any"
                  value={newX}
                  onChange={(e) => {
                    // walidacja X dla -10000 i 10000
                    // Jak nie ma minusa to max 5 znaków
                    if (e.target.value.length > 5 && e.target.value[0] !== "-")
                      return;
                    // Jak jest minus to max 6 znaków
                    if (e.target.value.length > 6 && e.target.value[0] === "-")
                      return;
                    setError(null);
                    if (e.target.value.length > 0) {
                      // Sprawdzenie czy X jest w dozwolonym zakresie
                      const x = Number.parseFloat(e.target.value);
                      if (x < -10000 || x > 10000) {
                        setError(
                          "Współrzędna X musi być w zakresie -10000 do 10000"
                        );
                      }
                    }
                    return setNewX(e.target.value);
                  }}
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
                  onChange={(e) => {
                    // walidacja Y dla -10000 i 10000
                    // Jak nie ma minusa to max 5 znaków
                    if (e.target.value.length > 5 && e.target.value[0] !== "-")
                      return;
                    // Jak jest minus to max 6 znaków
                    if (e.target.value.length > 6 && e.target.value[0] === "-")
                      return;
                    setError(null);
                    if (e.target.value.length > 0) {
                      // Sprawdzenie czy Y jest w dozwolonym zakresie
                      const y = Number.parseFloat(e.target.value);
                      if (y < -10000 || y > 10000) {
                        setError(
                          "Współrzędna Y musi być w zakresie -10000 do 10000"
                        );
                      }
                    }
                    return setNewY(e.target.value);
                  }}
                  placeholder="Y"
                />
              </div>
            </div>

            {error && (
              // Wyświetlenie alertu w przypadku błędu walidacji
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
