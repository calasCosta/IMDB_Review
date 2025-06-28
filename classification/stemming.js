/*
Stemming reduz palavras às suas raízes, para que variações gramaticais não prejudiquem a análise.
- Agrupar variações da mesma palavra (ex: run, running, runs → run).
- Reduzir o vocabulário (menos termos para o modelo aprender).
- Aumentar a robustez do classificador (palavras com mesmo significado tratadas como iguais).
*/

const natural = require('natural');
const stemmer = natural.PorterStemmer;

// Aplica stemming a cada palavra de um array ou string
function applyStemming(input) {
    let words = [];

    if (Array.isArray(input)) {
        words = input;
    } else if (typeof input === 'string') {
        words = input.split(' ');
    } else {
        throw new TypeError("applyStemming requires a string or an array of words");
    }

    return words.map(word => stemmer.stem(word)).join(' ');
}

module.exports = { applyStemming };
