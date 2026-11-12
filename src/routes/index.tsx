import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as RMouseEvent } from "react";

import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { loadStoryblokBridge, storyblokEditable } from '@storyblok/react';
import { cubeContentOptions } from '@/lib/cube-content.functions';
import { faceKeyForStory, storySchema, type CubeStory } from '@/lib/cube-content';
import { CubeStoryBlocks } from '@/components/cube-storyblok';

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cubeContentOptions),
  head: ({ loaderData }) => {
    const content = loaderData?.stories.find(story => story.full_slug === 'cube-front')?.content;
    const title = content?.seo_title || 'Tesseract — A Website Shaped Like a Cube';
    const description = content?.seo_description || 'Scroll vertically and horizontally to rotate through six faces of a 3D cube.';
    return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
  },
  component: Index,
});

type Face = { key: string; label: string; title: string; body: string; transform: string };

const defaultFaces: Face[] = [
  { key: "front", label: "01 / Front", title: "Enter the cube", body: "Scroll down to tumble forward. Scroll sideways to turn. Every face is a room.", transform: "rotateY(0deg)" },
  { key: "right", label: "02 / East", title: "Depth is a direction", body: "Space isn't flat. Neither is this page. You've turned ninety degrees into it.", transform: "rotateY(90deg)" },
  { key: "back", label: "03 / Behind", title: "The far side", body: "What you left behind is still here, waiting on the opposite wall.", transform: "rotateY(180deg)" },
  { key: "left", label: "04 / West", title: "Turn again", body: "Four walls around you. Now look up and down.", transform: "rotateY(-90deg)" },
  { key: "top", label: "05 / Above", title: "The ceiling", body: "Scroll up from the front to reach the sky of the cube.", transform: "rotateX(90deg)" },
  { key: "bottom", label: "06 / Below", title: "The floor", body: "Grounded. Six faces, one object, infinite angles.", transform: "rotateX(-90deg)" },
];

const navButtons = [
  { glyph: "↑", label: "Tilt up", dx: -90, dy: 0, tx: "0px", ty: "-22px", pos: "top" },
  { glyph: "↓", label: "Tilt down", dx: 90, dy: 0, tx: "0px", ty: "22px", pos: "bottom" },
  { glyph: "←", label: "Turn left", dx: 0, dy: 90, tx: "-22px", ty: "0px", pos: "left" },
  { glyph: "→", label: "Turn right", dx: 0, dy: -90, tx: "22px", ty: "0px", pos: "right" },
];

function Index() {
  const { data } = useSuspenseQuery(cubeContentOptions);
  const queryClient = useQueryClient();
  const [liveStories, setLiveStories] = useState<Record<string, CubeStory>>({});
  const stories = data.stories.map(story => liveStories[story.full_slug] ?? story);
  const faces = defaultFaces.map(face => {
    const story = stories.find(item => faceKeyForStory(item) === face.key);
    const teaser = story?.content.body.find(block => block.component === 'teaser');
    return { ...face, title: teaser?.headline ?? face.title, body: teaser?.intro ?? face.body, story };
  });
  const [matrix, setMatrix] = useState("none");
  const [active, setActive] = useState("front");
  const [contentRot, setContentRot] = useState<Record<string, number>>({});
  const [size, setSize] = useState(420);
  const [navStamp, setNavStamp] = useState(1);
  const turnRef = useRef<(dx: number, dy: number) => void>(() => {});
  const [page, setPage] = useState<{ key: string; closing: boolean } | null>(null);
  const pageRef = useRef(false);
  pageRef.current = page !== null;
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('_storyblok')) return;
    let disposed = false;
    void loadStoryblokBridge().then(() => {
      if (disposed || !window.StoryblokBridge) return;
      const bridge = new window.StoryblokBridge();
      bridge.on('input', event => {
        if (disposed) return;
        const parsed = storySchema.safeParse(event?.story);
        if (!parsed.success) return;
        const key = faceKeyForStory(parsed.data);
        if (!key) return;
        setLiveStories(previous => ({ ...previous, [parsed.data.full_slug]: parsed.data }));
        setPage({ key, closing: false });
      });
      bridge.on(['published', 'change'], () => {
        if (disposed) return;
        setLiveStories({});
        void queryClient.invalidateQueries({ queryKey: cubeContentOptions.queryKey });
      });
    }).catch(error => console.error('Storyblok editor could not load', error));
    return () => { disposed = true; };
  }, [queryClient]);

  useEffect(() => {
    // Orientation is a matrix; each input rotates around SCREEN axes (pre-multiplied),
    // so controls feel the same no matter which face is toward the camera.
    // Orientation stays axis-aligned: each gesture is locked to one axis (x or y)
    // and snaps to the nearest 90° on release, so no diagonal/roll ever builds up.
    let m = new DOMMatrix();
    const pending = { x: 0, y: 0 };
    const gesture = { x: 0, y: 0 };
    let axis: "x" | "y" | null = null;
    let snapping = false;
    const faceMats = defaultFaces.map((f) => ({ key: f.key, mat: new DOMMatrix(f.transform) }));

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
        setNavStamp(0);
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
      snapping = true;
    };

    // One face turn in a given direction, shared by arrow keys and nav buttons.
    const turn = (dx: number, dy: number) => {
      setNavStamp(0);
      orient(dx ? "x" : "y");
      pending.x += dx;
      pending.y += dy;
      snapping = true;
    };
    turnRef.current = turn;

    const resize = () => setSize(Math.min(window.innerWidth, window.innerHeight) * 0.55);
    resize();
    window.addEventListener("resize", resize);
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      if (pageRef.current) return;
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
      if (!touch || !t || pageRef.current) return;
      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      if (!axis && Math.hypot(dx, dy) < 6) return;
      push(dx * 0.4, dy * 0.4);
      touch = { x: t.clientX, y: t.clientY };
    };
    const te = () => { touch = null; if (!pageRef.current) release(); };
    const key = (e: KeyboardEvent) => {
      if (pageRef.current) return;
      const d: Record<string, [number, number]> = { ArrowUp: [90, 0], ArrowDown: [-90, 0], ArrowLeft: [0, 90], ArrowRight: [0, -90] };
      const k = d[e.key];
      if (k) turn(k[0], k[1]);
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
      // When the snap has finished settling, bloom the nav buttons onto the front face.
      if (snapping && Math.abs(sx) + Math.abs(sy) < 0.4) {
        snapping = false;
        setNavStamp(Date.now());
      }
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
  const openFace = (e: RMouseEvent) => {
    if (page || (e.target as HTMLElement).closest("button")) return;
    const dx = Math.abs(e.clientX - window.innerWidth / 2);
    const dy = Math.abs(e.clientY - window.innerHeight / 2);
    if (dx < half && dy < half) setPage({ key: active, closing: false });
  };
  const closePage = () => {
    setPage((p) => (p ? { ...p, closing: true } : p));
    setTimeout(() => setPage(null), 600);
  };
  const pageFace = faces.find((f) => f.key === page?.key);

  return (
    <main className="cube-stage fixed inset-0 overflow-hidden" onClick={openFace}>
      <div className="cube-grid" />
      <header className="absolute left-8 top-8 z-10 font-display text-sm tracking-[0.3em] text-muted-foreground">
        TESSERACT
      </header>
      <div className="absolute right-8 top-8 z-10 font-mono text-xs text-muted-foreground">
        {faces.find((f) => f.key === active)?.label}
      </div>

      <div className="flex h-full items-center justify-center" style={{ perspective: size * 3 }}>
        <div
          className="pointer-events-none relative"
          style={{
            width: size,
            height: size,
            transformStyle: "preserve-3d",
            transform: `rotateX(-10deg) rotateY(0deg) ${matrix}`,
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
                {...(f.story ? storyblokEditable(f.story.content._editable ? { _editable: f.story.content._editable } : {}) : {})}
                style={{ transform: `translateZ(calc(var(--well-depth) * -1)) rotate(${contentRot[f.key] ?? 0}deg)` }}
              >
                <span className="font-mono text-xs tracking-widest text-primary">{f.label}</span>
                <div>
                  <h2 className="font-display text-4xl leading-none text-foreground md:text-5xl">{f.title}</h2>
                  <p className="mt-4 max-w-xs text-sm text-muted-foreground">{f.body}</p>
                </div>
              </div>
                {navStamp > 0 && active === f.key && (
                  <nav key={navStamp} className="cube-nav" aria-label="Cube navigation" style={{ transform: `translateZ(40px) rotate(${contentRot[f.key] ?? 0}deg)` }}>
                    {navButtons.map((n, i) => (
                      <button
                        key={n.label}
                        type="button"
                        aria-label={n.label}
                        className={`cube-nav-btn cube-nav-${n.pos}`}
                        style={{ "--i": i, "--tx": n.tx, "--ty": n.ty } as CSSProperties}
                        onClick={() => turnRef.current(n.dx, n.dy)}
                      >
                        {n.glyph}
                      </button>
                    ))}
                  </nav>
                )}
            </section>
          ))}
        </div>
      </div>

      {pageFace && page && (
        <div
          className={`face-page ${page.closing ? "face-page-closing" : ""}`}
          style={{ "--start": `calc(50% - ${half}px)` } as CSSProperties}
          onClick={(e) => { e.stopPropagation(); closePage(); }}
        >
          <article className="mx-auto max-w-3xl px-8 py-24">
            <span className="font-mono text-xs tracking-widest text-primary">{pageFace.label}</span>
            {pageFace.story ? <CubeStoryBlocks blocks={pageFace.story.content.body} /> : <>
            <h1 className="mt-6 font-display text-6xl leading-none text-foreground md:text-8xl">{pageFace.title}</h1>
            <p className="mt-8 text-lg text-muted-foreground">{pageFace.body}</p>
            {[1, 2, 3, 4, 5].map((n) => (
              <section key={n} className="mt-20 border-t border-border pt-10">
                <h2 className="font-display text-4xl text-foreground">Chapter {n}</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Inside the face, the cube unfolds into a page. Space opens up, edges dissolve, and the room becomes a place to read. Scroll as far as you like — the walls will wait.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Every face holds its own story. Tap anywhere to fold this page back into the cube and keep exploring the other sides.
                </p>
              </section>
            ))}
            </>}
            <p className="mt-24 text-center font-mono text-xs text-muted-foreground">click anywhere to return to the cube</p>
          </article>
        </div>
      )}

      <footer className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center font-mono text-xs text-muted-foreground">
        scroll ↕ · shift/trackpad ↔ · arrow keys · swipe
      </footer>
    </main>
  );
}
