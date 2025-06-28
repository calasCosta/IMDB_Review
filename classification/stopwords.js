/*
    Stopwords são palavras muito comuns numa língua, que aparecem com grande frequência nos textos, 
    mas que não contribuem com significado relevante para a análise ou classificação do texto.
    Exemplos incluem palavras como "o", "a", "e", "de", "que", entre outras.
*/

const { removeStopwords } = require('stopword');

function removeGeneralStopwords(text) {
    const oldString = text.split(' ');
    return removeStopwords(oldString).join(' ');
}

function removeCustomStopwords(text, customStopwords = []) {
    const generalCleaned = removeGeneralStopwords(text);
    const customCleaned = generalCleaned.filter(word => !customStopwords.includes(word));
    return customCleaned.join(' ');
}

module.exports = { removeGeneralStopwords, removeCustomStopwords };