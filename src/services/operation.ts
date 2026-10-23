// Acquire synchronously: React state alone can allow two taps before a render.
export function createOperationGate() {
  let busy = false;
  return async (task: () => Promise<void>) => {
    if (busy) return;
    busy = true;
    try { await task(); } finally { busy = false; }
  };
}
