const product = {
  id: "demo-shoes",
  priceWhenAdded: 5000,
  stockWhenAdded: 10,
  addedAt: Date.now(),
};

let simulatedData = {
  price: product.priceWhenAdded,
  stock: product.stockWhenAdded,
};

async function fakeFetchItems(ids) {
  return ids.map((id) => ({
    id,
    price: simulatedData.price,
    stock: simulatedData.stock,
  }));
}

document.getElementById("originalPrice").textContent = product.priceWhenAdded;
document.getElementById("originalStock").textContent = product.stockWhenAdded;

document.getElementById("priceInput").value = product.priceWhenAdded;
document.getElementById("stockInput").value = product.stockWhenAdded;

function renderAlerts(alerts) {
  const el = document.getElementById("alerts");
  if (alerts.length === 0) {
    el.textContent = "(none yet)";
    return;
  }
  el.innerHTML = alerts
    .map(
      (a) => `
        <div class="alert ${a.type}">
          <strong>${a.type}</strong>: ${a.message}
          <button onclick="SmartWishlistAlerts.dismissAlert('${a.id}')">Dismiss</button>
        </div>
      `,
    )
    .join("");
}

SmartWishlistAlerts.init({
  items: [product],
  fetchItems: fakeFetchItems,
  onAlertsChange: renderAlerts,
  priceDropThreshold: 5,
  lowStockThreshold: 5,
  reminderDays: 0.0001157,
  repeatReminders: false,
  pollInterval: 1000 * 60 * 60,
});

document.getElementById("applyBtn").addEventListener("click", () => {
  const newPrice = Number(document.getElementById("priceInput").value);
  const newStock = Number(document.getElementById("stockInput").value);

  simulatedData = { price: newPrice, stock: newStock };

  SmartWishlistAlerts.checkNow();
});

setInterval(() => {
  const since = product.lastViewedAt ?? product.addedAt;
  const secondsElapsed = Math.floor((Date.now() - since) / 1000);
  document.getElementById("reminderTimer").textContent = secondsElapsed;
}, 200);

document.getElementById("checkReminderBtn").addEventListener("click", () => {
  SmartWishlistAlerts.checkNow();
});

document.getElementById("markViewedBtn").addEventListener("click", () => {
  SmartWishlistAlerts.markAsViewed(product.id);
  product.lastViewedAt = Date.now();
});
