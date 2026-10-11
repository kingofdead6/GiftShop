import { useEffect, useRef } from 'react';
import { drawPrint, fitCanvas } from '../lib/layerRender';
import { useReducedMotion } from '../lib/motion';

/**
 * A procedural print on a canvas.
 *
 *   spin       rotate the surface pattern while true (card hover)
 *   printOnView  print layer by layer the first time it scrolls into view
 *   draggable  drag horizontally to turn the piece, with inertia
 *
 * The animation loop only runs while something is moving and the canvas is on
 * screen; a still card costs one draw.
 */
export default function PrintCanvas({
  shape,
  color,
  glow,
  spin = false,
  printOnView = false,
  draggable = false,
  tilt = 0.26,
  padding = 0.12,
  stopAt = 1,
  className = '',
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const state = useRef({ rot: 0.6, vel: 0, progress: printOnView && !reduced ? 0 : stopAt, visible: false, dragging: false });
  const props = useRef({});
  props.current = { shape, color, glow, spin, tilt, padding };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const st = state.current;
    let frame = 0;
    let last = 0;

    const render = () => {
      const { ctx, w, h } = fitCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      const p = props.current;
      drawPrint(ctx, w, h, {
        shape: p.shape,
        color: p.color,
        glow: p.glow,
        tilt: p.tilt,
        padding: p.padding,
        rotation: st.rot,
        progress: st.progress,
        nozzle: st.progress < 1,
      });
    };

    const moving = () =>
      st.visible && (st.progress < stopAt || props.current.spin || st.dragging || Math.abs(st.vel) > 0.0005);

    const tick = (time) => {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      if (st.progress < stopAt) st.progress = Math.min(stopAt, st.progress + dt / 2.6);
      if (props.current.spin && !st.dragging) st.rot += dt * 0.9;
      if (!st.dragging) {
        st.rot += st.vel;
        st.vel *= 0.94;
      }
      render();
      frame = moving() ? requestAnimationFrame(tick) : 0;
      if (!frame) last = 0;
    };

    const kick = () => {
      if (!frame && moving() && !reduced) frame = requestAnimationFrame(tick);
    };
    st.kick = kick;

    const io = new IntersectionObserver(([entry]) => {
      st.visible = entry.isIntersecting;
      if (st.visible) {
        render();
        kick();
      }
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);
    render();

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reduced, stopAt]);

  // Prop changes: redraw, and start the loop if they set something moving.
  useEffect(() => {
    const st = state.current;
    const canvas = ref.current;
    if (!canvas || !st.kick) return;
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    drawPrint(ctx, w, h, { shape, color, glow, tilt, padding, rotation: st.rot, progress: st.progress, nozzle: st.progress < 1 });
    st.kick();
  }, [shape, color, glow, spin, tilt, padding]);

  const drag = draggable
    ? {
        onPointerDown: (e) => {
          const st = state.current;
          st.dragging = true;
          st.lastX = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
          st.kick?.();
        },
        onPointerMove: (e) => {
          const st = state.current;
          if (!st.dragging) return;
          const dx = e.clientX - st.lastX;
          st.lastX = e.clientX;
          st.rot -= dx * 0.012;
          st.vel = -dx * 0.012;
        },
        onPointerUp: () => {
          state.current.dragging = false;
          state.current.kick?.();
        },
        onPointerCancel: () => {
          state.current.dragging = false;
        },
      }
    : {};

  return (
    <canvas
      ref={ref}
      className={`${className} ${draggable ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''}`}
      aria-hidden="true"
      {...drag}
    />
  );
}
