export function formatPrice(value) {
  return `${Number(value).toLocaleString("ru-RU")} ₽`;
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) {
    return `${rest} мин`;
  }

  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

export function formatDate(value) {
  const date = new Date(`${String(value).replace(" ", "T")}Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function discountedPrice(price, discountPercent) {
  return price - Math.round((price * discountPercent) / 100);
}
