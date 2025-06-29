/*
    Objectivo: Limpar texto para classificação de documentos
        Minúsculas
        Remover:
        - Pontuação
        - Números
        - Caracteres especiais
        - Emojis (opcional)
        - Espaços extra
*/

function toLowerCase(text) {
    if (typeof text !== 'string') return '';  
    return text.toLowerCase();
}

function cleanWhitespace(text) {
    if (typeof text !== 'string') return '';
    return text.trim().replace(/\s+/g, ' ');
}

function removeHtmlTags(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '');
}

function cleanQuotes(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/['"]/g, '');
}

function keepAlphabeticOnly(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[^a-zA-Z_\s]/g, '');
}

function cleanText(text) {
    if (typeof text !== 'string') return '';
    let cleaned = text;
    cleaned = removeHtmlTags(cleaned);
    cleaned = cleanQuotes(cleaned);
    cleaned = toLowerCase(cleaned);
    cleaned = keepAlphabeticOnly(cleaned);
    cleaned = cleanWhitespace(cleaned);
    return cleaned;
}

module.exports = { 
    toLowerCase, 
    cleanWhitespace, 
    removeHtmlTags,
    cleanQuotes,
    keepAlphabeticOnly, 
    cleanText 
};