import { calculateConvexHull, crossProduct } from "../convex-hull-calculator";

interface Point {
  id: string;
  x: number;
  y: number;
}

describe("crossProduct", () => {
  const A: Point = { id: "A", x: 0, y: 0 };
  const B: Point = { id: "B", x: 1, y: 0 };
  const C_left: Point = { id: "C1", x: 1, y: 1 };
  const C_right: Point = { id: "C2", x: 1, y: -1 };
  const C_collinear: Point = { id: "C3", x: 2, y: 0 };

  it("lewoskręt (>0)", () => {
    expect(crossProduct(A, B, C_left)).toBeGreaterThan(0);
  });

  it("prawoskręt (<0)", () => {
    expect(crossProduct(A, B, C_right)).toBeLessThan(0);
  });

  it("współliniowe (=0)", () => {
    expect(crossProduct(A, B, C_collinear)).toBe(0);
  });
});

describe("calculateConvexHull – przypadki brzegowe", () => {
  it("brak punktów → []", () => {
    expect(calculateConvexHull([])).toEqual([]);
  });

  it("jeden punkt → ten sam", () => {
    const p: Point = { id: "p", x: 5, y: 5 };
    expect(calculateConvexHull([p])).toEqual([p]);
  });

  it("dwa punkty → w tej samej kolejności", () => {
    const p1: Point = { id: "1", x: 0, y: 0 };
    const p2: Point = { id: "2", x: 1, y: 1 };
    expect(calculateConvexHull([p1, p2])).toEqual([p1, p2]);
  });
});

describe("calculateConvexHull – proste kształty", () => {
  it("kwadrat + punkt wewnętrzny", () => {
    const pts = [
      { id: "0", x: 0, y: 0 },
      { id: "1", x: 2, y: 0 },
      { id: "2", x: 2, y: 2 },
      { id: "3", x: 0, y: 2 },
      { id: "4", x: 1, y: 1 },
    ];
    const hull = calculateConvexHull(pts).map((p) => [p.x, p.y]);
    expect(hull).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
  });

  it("punkty na linii poziomej", () => {
    const pts = [0, 1, 2, 3].map((i) => ({ id: "" + i, x: i, y: 0 }));
    const hull = calculateConvexHull(pts).map((p) => [p.x, p.y]);
    expect(hull).toEqual([
      [0, 0],
      [3, 0],
    ]);
  });

  it("punkty na linii pionowej", () => {
    const pts = [0, 1, 2, 3].map((i) => ({ id: "" + i, x: 0, y: i }));
    const hull = calculateConvexHull(pts).map((p) => [p.x, p.y]);
    expect(hull).toEqual([
      [0, 0],
      [0, 3],
    ]);
  });
});

describe("calculateConvexHull – duplikaty i floaty", () => {
  it("usunięcie duplikatów", () => {
    const pts = [
      { id: "A", x: 0, y: 0 },
      { id: "B1", x: 1, y: 1 },
      { id: "B2", x: 1, y: 1 },
      { id: "C", x: 2, y: 2 },
      { id: "D", x: 0, y: 2 },
    ];
    const hull = calculateConvexHull(pts).map((p) => [p.x, p.y]);
    expect(hull).toEqual([
      [0, 0],
      [2, 2],
      [0, 2],
    ]);
  });

  it("floaty i ujemne współrzędne", () => {
    const pts: Point[] = [
      { id: "A", x: -1.5, y: 0.0 },
      { id: "B", x: 0.0, y: -2.25 },
      { id: "C", x: 1.5, y: 0.0 },
      { id: "D", x: 0.0, y: 2.25 },
      { id: "E", x: 0.0, y: 0.0 },
    ];

    const hull = calculateConvexHull(pts).map((p) => [p.x, p.y]);

    const sorted = hull.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    expect(sorted).toHaveLength(4);

    expect(sorted[0][0]).toBeCloseTo(-1.5, 5);
    expect(sorted[0][1]).toBeCloseTo(0.0, 5);

    expect(sorted[1][0]).toBeCloseTo(0.0, 5);
    expect(sorted[1][1]).toBeCloseTo(-2.25, 5);

    expect(sorted[2][0]).toBeCloseTo(0.0, 5);
    expect(sorted[2][1]).toBeCloseTo(2.25, 5);

    expect(sorted[3][0]).toBeCloseTo(1.5, 5);
    expect(sorted[3][1]).toBeCloseTo(0.0, 5);
  });
});

describe("calculateConvexHull – kształt wklęsły (U-shape)", () => {
  it("nie bierze punków wwklęsłych do obwiedni", () => {
    const U: Point[] = [
      { id: "A", x: 0, y: 0 },
      { id: "B", x: 2, y: 0 },
      { id: "C", x: 2, y: 2 },
      { id: "D", x: 1, y: 2 },
      { id: "E", x: 1, y: 1 }, // wklęsły
      { id: "F", x: 0, y: 2 },
    ];
    const hull = calculateConvexHull(U).map((p) => [p.x, p.y]);
    expect(hull).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]);
  });
});
