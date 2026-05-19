function formatNumber(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number)) return "0";
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
}

function formatWeight(value) {
    return formatNumber(value);
}
