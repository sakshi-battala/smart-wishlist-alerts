import { WishlistItem, WishlistAlert, FetchedItemData } from "./types";
import {
  ItemAlertState,
  createInitialState,
  checkPriceDrop,
  checkLowStock,
  checkBackInStock,
  checkReminder,
} from "./checkers";
import { createPoller } from "./poller";
import { createStore } from "./store";

export interface InitOptions {
  items: WishlistItem[];
  fetchItems: (ids: (string | number)[]) => Promise<FetchedItemData[]>;
  onAlertsChange: (alerts: WishlistAlert[]) => void;
  priceDropThreshold: number;
  lowStockThreshold: number;
  reminderDays: number;
  repeatReminders: boolean;
  pollInterval: number;
}

let itemsById = new Map<string | number, WishlistItem>();
let statesById = new Map<string | number, ItemAlertState>();
let store: ReturnType<typeof createStore> | null = null;
let poller: ReturnType<typeof createPoller> | null = null;
let settings: {
  priceDropThreshold: number;
  lowStockThreshold: number;
  reminderDays: number;
  repeatReminders: boolean;
  pollInterval: number;
} | null = null;

function runAllChecks(freshData: FetchedItemData[]) {
  if (!store || !settings) return;

  for (const fresh of freshData) {
    const item = itemsById.get(fresh.id);
    const state = statesById.get(fresh.id);
    if (!item || !state) continue;

    const priceDropAlert = checkPriceDrop(
      item,
      fresh,
      state,
      settings.priceDropThreshold,
    );
    if (priceDropAlert) store.addAlert(priceDropAlert);

    const lowStockAlert = checkLowStock(
      item,
      fresh,
      state,
      settings.lowStockThreshold,
    );
    if (lowStockAlert) store.addAlert(lowStockAlert);

    const backInStockAlert = checkBackInStock(item, fresh, state);
    if (backInStockAlert) store.addAlert(backInStockAlert);
  }

  // Reminders aren't tied to fetched data, they're checked for every known item, every round
  for (const item of itemsById.values()) {
    const state = statesById.get(item.id);
    if (!state) continue;
    const reminderAlert = checkReminder(
      item,
      state,
      settings.reminderDays,
      settings.repeatReminders,
    );
    if (reminderAlert) store.addAlert(reminderAlert);
  }
}

function validateRequired(options: InitOptions) {
  const missing: string[] = [];
  if (!options.items) missing.push("items");
  if (!options.fetchItems) missing.push("fetchItems");
  if (!options.onAlertsChange) missing.push("onAlertsChange");
  if (options.priceDropThreshold === undefined)
    missing.push("priceDropThreshold");
  if (options.lowStockThreshold === undefined)
    missing.push("lowStockThreshold");
  if (options.reminderDays === undefined) missing.push("reminderDays");
  if (options.repeatReminders === undefined) missing.push("repeatReminders");
  if (options.pollInterval === undefined) missing.push("pollInterval");

  if (missing.length > 0) {
    throw new Error(
      `[SmartWishlistAlerts] init() is missing required option(s): ${missing.join(", ")}`,
    );
  }
}

function init(options: InitOptions) {
  validateRequired(options);

  itemsById = new Map(options.items.map((item) => [item.id, item]));
  statesById = new Map(
    options.items.map((item) => [item.id, createInitialState(item)]),
  );

  settings = {
    priceDropThreshold: options.priceDropThreshold,
    lowStockThreshold: options.lowStockThreshold,
    reminderDays: options.reminderDays,
    repeatReminders: options.repeatReminders,
    pollInterval: options.pollInterval,
  };

  store = createStore(options.onAlertsChange);

  poller = createPoller({
    pollInterval: settings.pollInterval,
    fetchItems: options.fetchItems,
    getIds: () => Array.from(itemsById.keys()),
    onResult: runAllChecks,
  });

  poller.start();
}

function updateItems(newItems: WishlistItem[]) {
  const newItemsById = new Map(newItems.map((item) => [item.id, item]));
  const newStatesById = new Map<string | number, ItemAlertState>();

  for (const item of newItems) {
    const existingState = statesById.get(item.id);
    newStatesById.set(item.id, existingState ?? createInitialState(item));
  }

  itemsById = newItemsById;
  statesById = newStatesById;
}

function dismissAlert(alertId: string) {
  store?.dismissAlert(alertId);
}

function markAsViewed(itemId: string | number) {
  const item = itemsById.get(itemId);
  if (item) {
    item.lastViewedAt = Date.now();
  }
}

function getAlerts(): WishlistAlert[] {
  return store?.getAlerts() ?? [];
}

const SmartWishlistAlerts = {
  init,
  updateItems,
  dismissAlert,
  markAsViewed,
  getAlerts,
};
export default SmartWishlistAlerts;
