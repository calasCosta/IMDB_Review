/*
Stemming reduz palavras às suas raízes, para que variações gramaticais não prejudiquem a análise.
- Agrupar variações da mesma palavra (ex: run, running, runs → run).
- Reduzir o vocabulário (menos termos para o modelo aprender).
- Aumentar a robustez do classificador (palavras com mesmo significado tratadas como iguais).
*/

const stemmer = require('porter-stemmer').stemmer;

function applyStemming(text) {
    return text.split(' ')
              .map(word => stemmer(word))
              .join(' ');
}

module.exports = { applyStemming };