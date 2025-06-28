/*
    Stopwords são palavras muito comuns numa língua, que aparecem com grande frequência nos textos, 
    mas que não contribuem com significado relevante para a análise ou classificação do texto.
    Exemplos incluem palavras como "o", "a", "e", "de", "que", entre outras.
*/

const { removeStopwords } = require('stopword');

/**
 * Remove stopwords gerais.
 * Retorna um array de palavras filtradas.
 */
function removeGeneralStopwords(text) {
    const words = text.split(' ');
    return removeStopwords(words);  // retorna array
}

/**
 * Remove stopwords gerais e depois remove stopwords customizadas.
 * Retorna a string final.
 */
function removeCustomStopwords(text, customStopwords = []) {
    const generalCleaned = removeGeneralStopwords(text); // array
    const customCleaned = generalCleaned.filter(word => !customStopwords.includes(word));
    return customCleaned.join(' ');
}

module.exports = { removeGeneralStopwords, removeCustomStopwords };
