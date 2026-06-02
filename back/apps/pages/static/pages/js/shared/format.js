/**
 * formatNumber - общий helper, который нужен разным страницам.
 * На вход получает: value. Возвращает готовое значение или DOM-элемент, который можно использовать в любом модуле.
 * Такие функции вынесены отдельно, чтобы форматирование и мелкие DOM-операции были одинаковыми во всем проекте.
 */
function formatNumber(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return "0";
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
}

/**
 * formatWeight - общий helper, который нужен разным страницам.
 * На вход получает: value. Возвращает готовое значение или DOM-элемент, который можно использовать в любом модуле.
 * Такие функции вынесены отдельно, чтобы форматирование и мелкие DOM-операции были одинаковыми во всем проекте.
 */
function formatWeight(value) {
    return formatNumber(value);
}

/**
 * formatTonnage - общий helper, который нужен разным страницам.
 * На вход получает: value. Возвращает готовое значение или DOM-элемент, который можно использовать в любом модуле.
 * Такие функции вынесены отдельно, чтобы форматирование и мелкие DOM-операции были одинаковыми во всем проекте.
 */
function formatTonnage(value) {
    return `${formatNumber(Number(value || 0) / 1000)} т`;
}
