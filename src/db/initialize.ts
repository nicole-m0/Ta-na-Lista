// A connection handed to the store is process-lived. Only unpublished connections
// are closed here, so an active repository/read is never closed by effect cleanup.
export async function initializeDatabase<T extends { closeAsync(): Promise<void> }>(
  open: () => Promise<T>, prepare: (db: T) => Promise<void>,
  active: () => boolean, publish: (db: T) => void,
) {
  const db = await open();
  let published = false;
  try {
    if (!active()) return;
    await prepare(db);
    if (!active()) return;
    publish(db);
    published = true;
  } finally {
    if (!published) await db.closeAsync();
  }
}
