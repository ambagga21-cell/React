// Утилиты форматирования для пользовательского интерфейса

// Форматирование времени: отображение в часах и минутах
// Например: 60 -> "1 час", 90 -> "1 час 30 мин", 120 -> "2 часа", 45 -> "45 мин"
export function formatDuration(totalMinutes) {
  const mins = parseInt(totalMinutes, 10) || 0;
  if (mins <= 0) return '0 мин';
  const hours = Math.floor(mins / 60);
  const remainderMinutes = mins % 60;

  if (hours === 0) {
    return `${remainderMinutes} мин`;
  }

  let hourStr = 'часов';
  const lastH = hours % 10;
  const last10H = hours % 100;
  if (lastH === 1 && last10H !== 11) {
    hourStr = 'час';
  } else if ([2, 3, 4].includes(lastH) && ![12, 13, 14].includes(last10H)) {
    hourStr = 'часа';
  }

  if (remainderMinutes === 0) {
    return `${hours} ${hourStr}`;
  }

  return `${hours} ${hourStr} ${remainderMinutes} мин`;
}

// Расчет итоговой цены с учетом скидки (с точностью до копеек)
export function calculateFinalPrice(price, discountPercent) {
  const p = Number(price) || 0;
  const d = Number(discountPercent) || 0;
  if (d <= 0) return p;
  return Math.round(p * (1 - d / 100) * 100) / 100;
}

// Форматирование цены в рублях (целые числа без дроби, копейки с 2 знаками)
// Например: 2500 -> "2 500 ₽", 0.01 -> "0,01 ₽"
export function formatPrice(value) {
  const num = Number(value);
  if (isNaN(num)) return '0 ₽';
  const hasFractions = num % 1 !== 0;
  if (hasFractions) {
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' ₽';
  }
  return num.toLocaleString('ru-RU') + ' ₽';
}
