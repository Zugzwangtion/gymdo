/**
 * createInfoParagraph - общий helper, который нужен разным страницам.
 * На вход получает: text. Возвращает готовое значение или DOM-элемент, который можно использовать в любом модуле.
 * Такие функции вынесены отдельно, чтобы форматирование и мелкие DOM-операции были одинаковыми во всем проекте.
 */
function createInfoParagraph(text) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
}
