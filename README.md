# Smart Wishlist Alerts

A small JavaScript/TypeScript library, built to work with any framework, that watches wishlist items and raises alerts when something worth knowing happens: a price drop, low stock, a restock, or a reminder that the user hasn't looked at an item in a while.

It does not store or fetch your data. You give it a small function that knows how to fetch fresh price/stock for a batch of item IDs, and it handles the rest: polling, comparing, and deciding when something is worth alerting about.

Works in any web app — React, Angular, plain HTML, anything — via a single `<script>` tag, or via npm if you prefer to bundle it yourself.

## Features

- **Price drop alerts** — fires when an item's price drops by a configurable percentage or more from when it was added (or from the last alerted price, for further drops).
- **Low stock warnings** — fires when stock falls below a threshold you choose. There is no built-in default; "low stock" means different things for different products, so you decide.
- **Back-in-stock notifications** — fires when an item's stock goes from `0` to something greater than `0`.
- **Reminders** — fires if the user hasn't viewed an item again within a configurable number of days. Can fire once, or repeat on a regular cycle until the user views the item.
- **Headless** — returns raw alert data; you decide how to display it (toast, banner, badge, anything).
- **Tiny** — the entire script-tag build is ~4 KB minified.
- **Tab-aware polling** — automatically pauses checks when the browser tab is hidden, and catches up immediately when it becomes visible again.

## Installation

### Script tag (CDN, works on any website)

```html
<script src="https://cdn.jsdelivr.net/npm/smart-wishlist-alerts@0.1.1/dist/wishlist-alerts.global.js"></script>
```

This creates a global `SmartWishlistAlerts` object on `window`.

### npm (for React, Angular, or any bundler-based project)

```bash
npm install smart-wishlist-alerts
```

```ts
import SmartWishlistAlerts from "smart-wishlist-alerts";
```

## Usage Example

```html
<script src="https://cdn.jsdelivr.net/npm/smart-wishlist-alerts@0.1.1/dist/wishlist-alerts.global.js"></script>
<script>
  async function fetchItems(ids) {
    // Your own function — call your backend however you like.
    // Must return an array of { id, price, stock }.
    const res = await fetch(`/api/products?ids=${ids.join(",")}`);
    return res.json();
  }

  SmartWishlistAlerts.init({
    items: [
      {
        id: 101,
        priceWhenAdded: 1000,
        stockWhenAdded: 12,
        addedAt: Date.now(),
      },
    ],
    fetchItems,
    onAlertsChange: (alerts) => {
      // Called every time the alert list changes. Render however you like.
      console.log(alerts);
    },
    priceDropThreshold: 5, // percent
    lowStockThreshold: 5, // units
    reminderDays: 7,
    repeatReminders: false,
    pollInterval: 5 * 60 * 1000, // 5 minutes
  });
</script>
```

## API Reference

### `init(options)`

Starts the library. All options below are required.

| Option               | Type                                  | Description                                                                 |
| -------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `items`              | `WishlistItem[]`                      | The current wishlist. See shape below.                                      |
| `fetchItems`         | `(ids) => Promise<FetchedItemData[]>` | Your function for fetching fresh `{ id, price, stock }` for a batch of IDs. |
| `onAlertsChange`     | `(alerts) => void`                    | Called whenever the active alerts list changes.                             |
| `priceDropThreshold` | `number`                              | Percent drop required to trigger a price-drop alert (e.g. `5`).             |
| `lowStockThreshold`  | `number`                              | Stock level below which a low-stock alert fires (e.g. `5`).                 |
| `reminderDays`       | `number`                              | Days of inactivity before a reminder fires (e.g. `7`).                      |
| `repeatReminders`    | `boolean`                             | If `true`, reminders fire again every `reminderDays` cycle until viewed.    |
| `pollInterval`       | `number`                              | Milliseconds between automatic checks (e.g. `300000` for 5 minutes).        |

`init()` throws a clear error listing any missing required options, rather than guessing defaults.

### `updateItems(items)`

Call this whenever the wishlist itself changes (items added or removed). Items still present keep their existing alert history; new items start fresh; removed items are cleaned up automatically.

### `dismissAlert(alertId)`

Removes a specific alert from the active list. Call this when the user has seen or acted on it.

### `markAsViewed(itemId)`

Call this whenever the user views an item again. Resets that item's reminder countdown.

### `checkNow()`

Triggers an immediate check, outside the normal poll schedule. Useful for testing, or for "refresh now" style UI.

### `getAlerts()`

Returns the current array of active alerts at any point in time.

### Data shapes

```ts
interface WishlistItem {
  id: string | number;
  priceWhenAdded: number;
  stockWhenAdded: number;
  addedAt: number; // timestamp, ms
  lastViewedAt?: number; // timestamp, ms
}

interface FetchedItemData {
  id: string | number;
  price: number;
  stock: number;
}

interface WishlistAlert {
  id: string;
  itemId: string | number;
  type: "price_drop" | "low_stock" | "back_in_stock" | "reminder";
  message: string;
  createdAt: number;
}
```

## Configuration Options

All settings are passed into `init()` and are required — there are no silent defaults. This is intentional: a guessed "low stock" number, for example, could be meaningless or actively misleading depending on the product, so the library asks the integrating app to make that decision explicitly.

## Project Structure

```
src/
  types.ts      — shared data shapes (WishlistItem, FetchedItemData, WishlistAlert)
  checkers.ts   — the four alert checks: price drop, low stock, back-in-stock, reminder
  poller.ts     — the repeating timer; pauses/resumes based on tab visibility
  store.ts      — holds the live alert list, notifies the app on change
  index.ts      — public entry point: init(), updateItems(), dismissAlert(), markAsViewed(), getAlerts(), checkNow()
dist/           — built output (generated, not committed)
test/           — local test/demo page (HTML + JS, not part of the published package)
```

## How It Works

1. **Poller** — on a timer (default every 5 minutes), calls your `fetchItems` function with the current list of wishlist item IDs. Pauses automatically when the browser tab is hidden, and runs an immediate check when the tab becomes visible again.
2. **Checkers** — for each item, compares the fresh `{ price, stock }` data against what's remembered about that item, and decides whether a price drop, low stock, or back-in-stock condition has newly occurred. Reminders are checked separately, based on time since `addedAt` or `lastViewedAt`, independent of fetched data.
3. **Store** — any alert produced by a checker is added to an internal list, and `onAlertsChange` is called so the app can update its UI. Alerts are not repeated for the same occurrence — only for a genuinely new drop, restock, or reminder cycle.

## Local Testing

A demo page lives in `test/`, loading the library directly from the published CDN and using a small fake `fetchItems` you control by hand:

1. Open `test/index.html` in a browser.
2. Use the "Simulation" panel to type a new price/stock and click **Apply Changes** — this calls `checkNow()` so the result appears immediately, with no need to wait for the poll interval.
3. Use **Mark as Viewed** / the reminder timer to test reminder behavior (the demo uses a compressed ~10 second window instead of real days, purely for testing).

## Future Improvements

- A pre-built, optional UI component (toast/popup) for teams that don't want to build their own.
- Pluggable notifier adapters (email, push notifications) alongside in-app alerts.

## License

MIT
