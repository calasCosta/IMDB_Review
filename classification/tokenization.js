/*
    Transformar o texto em estrutura que o modelo consegue analisar.
    Criar Bag of Words, TF-IDF, ou outras representações.
    É o primeiro passo essencial para quase todos os métodos de NLP (Natural Language Processing).
*/

const nGram = require('@drorgl/n-gram').default;

function generateNGrams(text, n) {
    const words = text.split(' ');
    const negationSuffix = '_NEG';
    
    // Use the library's n-gram generation
    const baseNGrams = nGram(n)(words);
    
    // Apply negation handling
    return baseNGrams.map(gram => {
        if (gram.some(w => w.endsWith(negationSuffix))) {
            return gram.map(w => 
                w.endsWith(negationSuffix) ? w : w + negationSuffix
            );
        }
        return gram;
    });
}

module.exports = { generateNGrams };