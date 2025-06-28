/*
    Transformar o texto em estrutura que o modelo consegue analisar.
    Criar Bag of Words, TF-IDF, ou outras representações.
    É o primeiro passo essencial para quase todos os métodos de NLP (Natural Language Processing).
*/

const nGram = require('@drorgl/n-gram').default;

function generateNGrams(text, n) {
    const words = text.split(' ');
    return nGram(n)(words);
}

module.exports = { generateNGrams };