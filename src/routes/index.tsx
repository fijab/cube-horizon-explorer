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
  const [rot, setRot] = useState({ x: -12, y: 18 });
  const target = useRef({ x: -12, y: 18 });
  const cur = useRef({ x: -12, y: 18 });
  const [size, setSize] = useState(420);

  useEffect(() => {
    const resize = () => setSize(Math.min(window.innerWidth, window.innerHeight) * 0.55);
    resize();
    window.addEventListener("resize", resize);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const horiz = e.shiftKey ? e.deltaY : e.deltaX;
      const vert = e.shiftKey ? 0 : e.deltaY;
      target.current.y -= horiz * 0.15;
      target.current.x = Math.max(-90, Math.min(90, target.current.x + vert * 0.15));
    };
    let touch: { x: number; y: number } | null = null;
    const ts = (e: TouchEvent) => (touch = { x: e.touches[0].clientX, y: e.touches[0].clientY });
    const tm = (e: TouchEvent) => {
      if (!touch) return;
      const t = e.touches[0];
      target.current.y += (t.clientX - touch.x) * 0.4;
      target.current.x = Math.max(-90, Math.min(90, target.current.x - (t.clientY - touch.y) * 0.4));
      touch = { x: t.clientX, y: t.clientY };
    };
    const key = (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = { ArrowUp: [-90, 0], ArrowDown: [90, 0], ArrowLeft: [0, 90], ArrowRight: [0, -90] };
      const d = m[e.key];
      if (!d) return;
      target.current.x = Math.max(-90, Math.min(90, Math.round((target.current.x + d[0]) / 90) * 90));
      target.current.y = Math.round((target.current.y + d[1]) / 90) * 90;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", ts);
    window.addEventListener("touchmove", tm);
    window.addEventListener("keydown", key);
    let raf = 0;
    const loop = () => {
      cur.current.x += (target.current.x - cur.current.x) * 0.08;
      cur.current.y += (target.current.y - cur.current.y) * 0.08;
      setRot({ ...cur.current });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", ts);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("keydown", key);
    };
  }, []);

  const half = size / 2;
  const snap = (deg: number) => ((Math.round(deg / 90) % 4) + 4) % 4;
  const active =
    rot.x < -45 ? "bottom" : rot.x > 45 ? "top" : ["front", "left", "back", "right"][snap(rot.y)];

  return (
    <main className="cube-stage fixed inset-0 overflow-hidden">
      <div className="cube-grid" />
      <header className="absolute left-8 top-8 z-10 font-display text-sm tracking-[0.3em] text-muted-foreground">
        TESSERACT
      </header>
      <div className="absolute right-8 top-8 z-10 font-mono text-xs text-muted-foreground">
        X {rot.x.toFixed(0)}° · Y {rot.y.toFixed(0)}°
      </div>

      <div className="flex h-full items-center justify-center" style={{ perspective: size * 3 }}>
        <div
          className="relative"
          style={{
            width: size,
            height: size,
            transformStyle: "preserve-3d",
            transform: `rotateX(${-rot.x}deg) rotateY(${rot.y}deg)`,
          }}
        >
          {faces.map((f) => (
            <section
              key={f.key}
              className={`cube-face ${active === f.key ? "cube-face-active" : ""}`}
              style={{ width: size, height: size, transform: `${f.transform} translateZ(${half}px)` }}
            >
              <span className="font-mono text-xs tracking-widest text-primary">{f.label}</span>
              <div>
                <h2 className="font-display text-4xl leading-none text-foreground md:text-5xl">{f.title}</h2>
                <p className="mt-4 max-w-xs text-sm text-muted-foreground">{f.body}</p>
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
