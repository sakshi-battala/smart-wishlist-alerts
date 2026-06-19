import { FetchedItemData } from "./types";

export interface PollerOptions {
  pollInterval: number;
  fetchItems: (ids: (string | number)[]) => Promise<FetchedItemData[]>;
  getIds: () => (string | number)[];
  onResult: (data: FetchedItemData[]) => void;
}

export interface Poller {
  start: () => void;
  stop: () => void;
}

export function createPoller(options: PollerOptions): Poller {
  let timerId: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;

  async function runCheck() {
    const ids = options.getIds();
    if (ids.length === 0) return;

    try {
      const data = await options.fetchItems(ids);
      options.onResult(data);
    } catch (err) {
      console.warn("[SmartWishlistAlerts] fetchItems failed:", err);
    }
  }

  function startTimer() {
    if (timerId !== null) return;
    timerId = setInterval(runCheck, options.pollInterval);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function handleVisibilityChange() {
    if (!isRunning) return;

    if (document.hidden) {
      stopTimer();
    } else {
      runCheck();
      startTimer();
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    runCheck();
    startTimer();
  }

  function stop() {
    isRunning = false;
    stopTimer();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  return { start, stop };
}
