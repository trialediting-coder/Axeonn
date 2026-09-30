type Keyframes = Record<string, number | string | (number | string)[]>;

/**
 * Gate an infinite keyframe loop (a motion `animate` target) on a flag, e.g.
 * whether the element is on screen. When the flag is off, each value rests at
 * its first keyframe. Motion only stops a running loop when its target
 * changes, so swapping the target is what halts the per-frame work. Pair it
 * with `transition={active ? loopTransition : AT_REST}` so the snap to the
 * resting pose is instant instead of one more slow (and repeating) tween.
 */
export function loopWhile<T extends Keyframes>(active: boolean, keyframes: T): Keyframes {
  if (active) return keyframes;
  return Object.fromEntries(
    Object.entries(keyframes).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
}

export const AT_REST = { duration: 0 } as const;
