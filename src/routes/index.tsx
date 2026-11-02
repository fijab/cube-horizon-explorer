import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tesseract — A Website Shaped Like a Cube" },
      { name: "description", content: "Scroll vertically and horizontally to rotate through six faces of a 3D cube." },
      { property: "og:title", content: "Tesseract — A Website Shaped Like a Cube" },
      { property: "og:description", content: "Scroll in any direction to explore six faces in depth." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Face = { key: string; label: string; title: string; body: string; transform: string };

const faces: Face[] = [
  { key: "front", label: "01 / Front", title: "Enter the cube", body: "Scroll down to tumble forward. Scroll sideways to turn. Every face is a room.", transform: "rotateY(0deg)" },
  { key: "right", label: "02 / East", title: "Depth is a direction", body: "Space isn't flat. Neither is this page. You've turned ninety degrees into it.", transform: "rotateY(90deg)" },
  { key: "back", label: "03 / Behind", title: "The far side", body: "What you left behind is still here, waiting on the opposite wall.", transform: "rotateY(180deg)" },
  { key: "left", label: "04 / West", title: "Turn again", body: "Four walls around you. Now look up and down.", transform: "rotateY(-90deg)" },
  { key: "top", label: "05 / Above", title: "The ceiling", body: "Scroll up from the front to reach the sky of the cube.", transform: "rotateX(90deg)" },
  { key: "bottom", label: "06 / Below", title: "The floor", body: "Grounded. Six faces, one object, infinite angles.", transform: "rotateX(-90deg)" },
];

function Index() {
  const [matrix, setMatrix] = useState("none");
  const [active, setActive] = useState("front");
  const [contentRot, setContentRot] = useState<Record<string, number>>({});
  const [size, setSize] = useState(420);

  useEffect(() => {
    // Orientation is a matrix; each input rotates around SCREEN axes (pre-multiplied),
    // so controls feel the same no matter which face is toward the camera.
    // Orientation stays axis-aligned: each gesture is locked to one axis (x or y)
    // and snaps to the nearest 90° on release, so no diagonal/roll ever builds up.
    let m = new DOMMatrix();
    const pending = { x: 0, y: 0 };
    const gesture = { x: 0, y: 0 };
    let axis: "x" | "y" | null = null;
    const faceMats = faces.map((f) => ({ key: f.key, mat: new DOMMatrix(f.transform) }));

    // When a turn direction is known, pre-rotate the content of every hidden face
    // that this turn can bring to the front, so it lands upright after the snap.
    const orient = (a: "x" | "y") => {
      const front = faceMats.reduce((best, f) =>
        m.multiply(f.mat).transformPoint({ x: 0, y: 0, z: 1 }).z >
        m.multiply(best.mat).transformPoint({ x: 0, y: 0, z: 1 }).z ? f : best,
      );
      setContentRot((prev) => {
        const next = { ...prev };
        for (const f of faceMats) {
          if (f.key === front.key) continue;
          for (const k of [90, 180, 270]) {
            const R = a === "x" ? new DOMMatrix().rotateSelf(k, 0, 0) : new DOMMatrix().rotateSelf(0, k, 0);
            const M = R.multiply(m).multiply(f.mat);
            if (M.transformPoint({ x: 0, y: 0, z: 1 }).z < 0.9) continue;
            const up = M.transformPoint({ x: 0, y: -1, z: 0 });
            const angle = (Math.atan2(up.x, -up.y) * 180) / Math.PI;
            next[f.key] = -Math.round(angle / 90) * 90;
          }
        }
        return next;
      });
    };

    const push = (dx: number, dy: number) => {
      if (!axis) {
        axis = Math.abs(dx) >= Math.abs(dy) ? "y" : "x";
        orient(axis);
      }
      const v = axis === "y" ? dx : dy;
      pending[axis] += v;
      gesture[axis] += v;
    };
    const release = () => {
      for (const a of ["x", "y"] as const) {
        const snapTo = Math.round(gesture[a] / 90) * 90;
        pending[a] += snapTo - gesture[a];
        gesture[a] = 0;
      }
      axis = null;
    };

    const resize = () => setSize(Math.min(window.innerWidth, window.innerHeight) * 0.55);
    resize();
    window.addEventListener("resize", resize);
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const horiz = e.shiftKey ? e.deltaY : e.deltaX;
      const vert = e.shiftKey ? 0 : e.deltaY;
      push(-horiz * 0.15, -vert * 0.15);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(release, 160);
    };
    let touch: { x: number; y: number } | null = null;
    const ts = (e: TouchEvent) => { const t0 = e.touches[0]; if (t0) touch = { x: t0.clientX, y: t0.clientY }; };
    const tm = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!touch || !t) return;
      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      if (!axis && Math.hypot(dx, dy) < 6) return;
      push(dx * 0.4, dy * 0.4);
      touch = { x: t.clientX, y: t.clientY };
    };
    const te = () => { touch = null; release(); };
    const key = (e: KeyboardEvent) => {
      const d: Record<string, [number, number]> = { ArrowUp: [90, 0], ArrowDown: [-90, 0], ArrowLeft: [0, 90], ArrowRight: [0, -90] };
      const k = d[e.key];
      if (!k) return;
      orient(k[0] ? "x" : "y");
      pending.x += k[0];
      pending.y += k[1];
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", ts);
    window.addEventListener("touchmove", tm);
    window.addEventListener("touchend", te);
    window.addEventListener("keydown", key);
    let raf = 0;
    const loop = () => {
      const sx = pending.x * 0.1;
      const sy = pending.y * 0.1;
      pending.x -= sx;
      pending.y -= sy;
      if (Math.abs(sx) + Math.abs(sy) > 0.001) {
        m = new DOMMatrix().rotateSelf(sx, sy, 0).multiply(m);
        setMatrix(m.toString());
        let best = "front";
        let bestZ = -Infinity;
        for (const f of faceMats) {
          const n = m.multiply(f.mat).transformPoint({ x: 0, y: 0, z: 1 });
          if (n.z > bestZ) { bestZ = n.z; best = f.key; }
        }
        setActive(best);
      }
      raf = requestAnimationFrame(loop);
    };
    setMatrix(m.toString());
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", ts);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", te);
      clearTimeout(wheelTimer);
      window.removeEventListener("keydown", key);
    };
  }, []);

  const half = size / 2;

  return (
    <main className="cube-stage fixed inset-0 overflow-hidden">
      <div className="cube-grid" />
      <header className="absolute left-8 top-8 z-10 font-display text-sm tracking-[0.3em] text-muted-foreground">
        TESSERACT
      </header>
      <div className="absolute right-8 top-8 z-10 font-mono text-xs text-muted-foreground">
        {faces.find((f) => f.key === active)?.label}
      </div>

      <div className="flex h-full items-center justify-center" style={{ perspective: size * 3 }}>
        <div
          className="relative"
          style={{
            width: size,
            height: size,
            transformStyle: "preserve-3d",
            transform: `rotateX(-10deg) rotateY(-14deg) ${matrix}`,
          }}
        >
          {faces.map((f) => (
            <section
              key={f.key}
              className={`cube-face ${active === f.key ? "cube-face-active" : ""}`}
              style={{ width: size, height: size, transform: `${f.transform} translateZ(${half}px)` }}
            >
              <div className="cube-wall cube-wall-top" />
              <div className="cube-wall cube-wall-bottom" />
              <div className="cube-wall cube-wall-left" />
              <div className="cube-wall cube-wall-right" />
              <div
                className="cube-well flex flex-col justify-between p-8"
                style={{ transform: `translateZ(calc(var(--well-depth) * -1)) rotate(${contentRot[f.key] ?? 0}deg)` }}
              >
                <span className="font-mono text-xs tracking-widest text-primary">{f.label}</span>
                <div>
                  <h2 className="font-display text-4xl leading-none text-foreground md:text-5xl">{f.title}</h2>
                  <p className="mt-4 max-w-xs text-sm text-muted-foreground">{f.body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center font-mono text-xs text-muted-foreground">
        scroll ↕ · shift/trackpad ↔ · arrow keys · swipe
      </footer>
    </main>
  );
}
