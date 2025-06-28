/**
 * Chama os outros módulos na ordem certa 
    Retorna o objeto com:
    - Texto original
    - Texto limpo
    - Texto com stemming
    - Tokens de n valores (1, 2, ...)
 * 
 */


const { cleanText } = require('./clean');
const { removeGeneralStopwords, removeCustomStopwords } = require('./stopwords');
const { applyStemming } = require('./stemming');
const { generateNGrams } = require('./tokenization');

async function preprocessText(text, nValues = [1], customStopwords = []) {
    // Step 1: Clean text
    const cleanedText = cleanText(text);
    
    // Step 2: Remove stopwords
    const withoutStopwords = customStopwords.length > 0 
        ? removeCustomStopwords(cleanedText, customStopwords)
        : removeGeneralStopwords(cleanedText);
    
    // Step 3: Apply stemming
    const preprocessedText = applyStemming(withoutStopwords);
    
    // Step 4: Generate tokens
    const tokens = nValues.map(n => ({
                                        n,
                                        tokens: generateNGrams(preprocessedText, n) || []
                                    })
    );

    return {
        originalText: text,
        cleanedText,
        preprocessedText,
        tokens
    };
}

module.exports = { preprocessText };