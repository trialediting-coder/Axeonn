'use client';

// components/axeonproof/FlowField.tsx
// The slow silk "flow" fixed behind the whole /axeonproof page: two luminous
// ribbons of fine fibres in Axeon blue with a cyan sheen and a violet edge,
// folding across the dark. One small WebGL shader drawn at reduced resolution,
// paused off screen and in background tabs. Reduced motion: one still frame.
// No WebGL: a static blue glow in CSS.
import { useEffect, useRef, useState } from 'react';

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uGain;
uniform float uScroll;

vec3 ribbon(vec2 p, float t, float k, float amp, float width, float ph, vec3 deep, vec3 sheenCol) {
  float c = amp * sin(p.x * k + t * 0.35 + ph) + amp * 0.55 * sin(p.x * k * 2.1 - t * 0.22 + ph * 1.7);
  float w = width * (0.6 + 0.4 * sin(p.x * k * 0.8 + t * 0.18 + ph * 0.5));
  float v = (p.y - c) / w;
  float inside = smoothstep(1.0, 0.0, abs(v));
  float twist = sin(p.x * k * 1.4 + t * 0.3 + ph);
  float fibers = pow(0.5 + 0.5 * sin(v * 30.0 + twist * 3.0), 6.0);
  float sheen = exp(-pow((v - twist * 0.6) * 2.2, 2.0));
  float rim = exp(-pow((abs(v) - 1.0) * 10.0, 2.0));
  float halo = exp(-abs(v) * 1.1) * 0.22;
  vec3 col = mix(deep, sheenCol, sheen);
  return col * (inside * (0.22 + 0.6 * sheen + 0.3 * fibers) + rim * 0.45 + halo);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float a = -0.32;
  p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
  float t = uTime;

  vec3 blue = vec3(0.145, 0.388, 0.922);
  vec3 deep = vec3(0.07, 0.16, 0.55);
  vec3 cyan = vec3(0.35, 0.85, 1.0);
  vec3 violet = vec3(0.49, 0.30, 0.95);

  vec3 col = vec3(0.0);
  // Scrolling folds the silk: each ribbon's phase drifts with the page, in opposite directions.
  float s = uScroll;
  col += 1.3 * ribbon(p + vec2(0.0, 0.05 + 0.04 * sin(s * 0.7)), t, 1.05, 0.3, 0.44, s * 1.1, deep, mix(blue, cyan, 0.5));
  col += 0.8 * ribbon(p + vec2(0.3, -0.24), t * 0.8, 1.5, 0.2, 0.2, 2.1 - s * 0.8, deep * 0.8, mix(violet, cyan, 0.3));

  float vig = smoothstep(1.6, 0.1, length(p * vec2(0.7, 1.0)));
  col *= vig * uGain;
  col = 1.0 - exp(-col * 2.0);
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

export function FlowField({ className = '', gain = 1, scale = 0.55 }: { className?: string; gain?: number; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    const vs = gl && compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl && vs && fs ? gl.createProgram() : null;
    if (!gl || !vs || !fs || !prog) {
      setFailed(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    gl.uniform1f(gl.getUniformLocation(prog, 'uGain'), gain);

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Start mid-fold so the first frame already looks composed.
    const t0 = performance.now() - 14000;
    let raf = 0;
    let visible = false;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const k = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
      canvas.width = Math.max(1, Math.round(r.width * k));
      canvas.height = Math.max(1, Math.round(r.height * k));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    // Page scroll in screen heights, eased so the silk glides rather than jumps.
    const uScroll = gl.getUniformLocation(prog, 'uScroll');
    let scroll = window.scrollY / Math.max(1, window.innerHeight);
    const draw = (now: number) => {
      const target = window.scrollY / Math.max(1, window.innerHeight);
      scroll = still ? target : scroll + (target - scroll) * 0.06;
      gl.uniform1f(uScroll, scroll);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      raf = 0;
      draw(now);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (still) return draw(t0 + 14000);
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    resize();
    draw(performance.now());
    const ro = new ResizeObserver(() => {
      resize();
      draw(still ? t0 + 14000 : performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(canvas);
    document.addEventListener('visibilitychange', start);
    // Reduced motion: no loop, so redraw the still frame at the new scroll position.
    const onScroll = () => {
      if (still) draw(t0 + 14000);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', start);
      if (raf) cancelAnimationFrame(raf);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [gain, scale]);

  if (failed) {
    return (
      <div
        aria-hidden
        className={className}
        style={{ background: 'radial-gradient(60% 50% at 60% 55%, rgba(37,99,235,0.45), transparent 70%), radial-gradient(40% 30% at 35% 40%, rgba(34,211,238,0.18), transparent 70%)' }}
      />
    );
  }
  return <canvas ref={ref} aria-hidden className={`block ${className}`} />;
}
