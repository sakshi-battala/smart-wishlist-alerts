import { WishlistAlert } from "./types";

export interface Store {
  addAlert: (alert: WishlistAlert) => void;
  dismissAlert: (alertId: string) => void;
  getAlerts: () => WishlistAlert[];
}
export function createStore(
  onChange: (alerts: WishlistAlert[]) => void,
): Store {
  let alerts: WishlistAlert[] = [];

  function notify() {
    onChange(alerts);
  }

  function addAlert(alert: WishlistAlert) {
    alerts = [...alerts, alert];
    notify();
  }

  function dismissAlert(alertId: string) {
    const before = alerts.length;
    alerts = alerts.filter((a) => a.id !== alertId);
    if (alerts.length !== before) {
      notify(); // only notify if something actually changed
    }
  }

  function getAlerts() {
    return alerts;
  }

  return { addAlert, dismissAlert, getAlerts };
}
