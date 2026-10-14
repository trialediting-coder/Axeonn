// A bounded wait. Webhooks race slow side work (the leads inbox projection)
// against a short timer so Twilio never waits on it for long (ruling S4-R5).

/**
 * Resolves with the promise's value, or with undefined once `ms` pass first
 * (calling `onTimeout`, for an id-only log). The promise keeps running; its
 * rejection still propagates if it settles first, so callers `.catch` it.
 * The timer is cleared either way and never holds the process open.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      onTimeout?.();
      resolve(undefined);
    }, ms);
    (timer as { unref?: () => void }).unref?.();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
