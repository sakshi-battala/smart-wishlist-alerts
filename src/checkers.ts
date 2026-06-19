import {
  WishlistItem,
  FetchedItemData,
  WishlistAlert,
  AlertType,
} from "./types";

export interface ItemAlertState {
  lastAlertedPrice: number | null;
  lowStockActive: boolean;
  backInStockActive: boolean;
  wasOutOfStock: boolean;
  lastReminderSentAt: number | null;
}

export function createInitialState(item: WishlistItem): ItemAlertState {
  return {
    lastAlertedPrice: null,
    lowStockActive: false,
    backInStockActive: false,
    wasOutOfStock: item.stockWhenAdded === 0,
    lastReminderSentAt: null,
  };
}

function makeAlert(
  itemId: string | number,
  type: AlertType,
  message: string,
): WishlistAlert {
  return {
    id: `${itemId}-${type}-${Date.now()}`,
    itemId,
    type,
    message,
    createdAt: Date.now(),
  };
}

export function checkPriceDrop(
  item: WishlistItem,
  fresh: FetchedItemData,
  state: ItemAlertState,
  thresholdPercent: number,
): WishlistAlert | null {
  const oldPrice = item.priceWhenAdded;
  const newPrice = fresh.price;

  if (oldPrice <= 0) return null;

  if (newPrice >= oldPrice) {
    state.lastAlertedPrice = null;
    return null;
  }

  const comparisonPrice = state.lastAlertedPrice ?? oldPrice;

  const dropPercent = ((comparisonPrice - newPrice) / comparisonPrice) * 100;

  if (dropPercent >= thresholdPercent) {
    state.lastAlertedPrice = newPrice;
    const totalDropPercent = Math.round(
      ((oldPrice - newPrice) / oldPrice) * 100,
    );
    return makeAlert(
      item.id,
      "price_drop",
      `Price dropped by ${totalDropPercent}%`,
    );
  }

  return null;
}

export function checkLowStock(
  item: WishlistItem,
  fresh: FetchedItemData,
  state: ItemAlertState,
  threshold: number | undefined,
): WishlistAlert | null {
  if (threshold === undefined) return null;

  if (state.lowStockActive) {
    if (fresh.stock > threshold) {
      state.lowStockActive = false;
    }
    return null;
  }

  if (fresh.stock > 0 && fresh.stock < threshold) {
    state.lowStockActive = true;
    return makeAlert(item.id, "low_stock", `Only ${fresh.stock} left in stock`);
  }

  return null;
}

export function checkBackInStock(
  item: WishlistItem,
  fresh: FetchedItemData,
  state: ItemAlertState,
): WishlistAlert | null {
  let alert: WishlistAlert | null = null;

  if (state.wasOutOfStock && fresh.stock > 0 && !state.backInStockActive) {
    state.backInStockActive = true;
    alert = makeAlert(item.id, "back_in_stock", `Back in stock!`);
  }

  if (fresh.stock === 0) {
    state.wasOutOfStock = true;
    state.backInStockActive = false;
  } else {
    state.wasOutOfStock = false;
  }

  return alert;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function checkReminder(
  item: WishlistItem,
  state: ItemAlertState,
  reminderDays: number,
  repeat: boolean,
): WishlistAlert | null {
  const reminderMs = reminderDays * ONE_DAY_MS;
  const now = Date.now();

  const countdownStart = item.lastViewedAt ?? item.addedAt;

  const dueAt = countdownStart + reminderMs;
  if (now < dueAt) return null; // not due yet, nothing to do

  if (state.lastReminderSentAt === null) {
    state.lastReminderSentAt = now;
    return makeAlert(item.id, "reminder", "You still want this?");
  }

  if (repeat) {
    const nextDueAt = state.lastReminderSentAt + reminderMs;
    if (now >= nextDueAt) {
      state.lastReminderSentAt = now;
      return makeAlert(item.id, "reminder", "You still want this?");
    }
  }

  return null;
}
