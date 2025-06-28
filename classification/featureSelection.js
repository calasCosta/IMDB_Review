/*
    Agrupa os termos com o mesmo nome
    Para cada grupo, calcula:
        sumVector → soma dos campos
        ou avgVector → média dos campos
    Ordena pelo metric escolhido (e.g.: tfidf)
    Retorna os K melhores termos
*/

/*
    Improved feature selection with:
    - Better NaN handling
    - Balanced term selection
    - Configurable term weighting
    - Fallback mechanisms
*/

const bag = require('./bagOfWords');

function selectKBest(termArray, K, metric = 'tfidf', method = 'avg') {
    // Validation
    if (!termArray || termArray.length === 0) {
        console.warn('Empty termArray provided to selectKBest');
        return [];
    }

    if (!['binary', 'occurrences', 'tf', 'tfidf'].includes(metric)) {
        throw new Error("Invalid metric. Use: binary, occurrences, tf, tfidf");
    }

    // Clean data - remove invalid entries
    const validTerms = termArray.filter(term => 
        term && 
        term.name && 
        typeof term[metric] === 'number' && 
        !isNaN(term[metric])
    );

    if (validTerms.length === 0) {
        console.warn('No valid terms after filtering');
        return [];
    }

    // Group terms by name
    const grouped = validTerms.reduce((acc, term) => {
        if (!acc[term.name]) acc[term.name] = [];
        acc[term.name].push(term);
        return acc;
    }, {});

    // Summarize terms using specified method
    const summarized = Object.entries(grouped).map(([name, group]) => {
        try {
            return method === 'avg' 
                ? bag.avgVector(group) 
                : bag.sumVector(group);
        } catch (e) {
            console.error(`Error processing term ${name}:`, e);
            return null;
        }
    }).filter(term => term !== null);

    // Fallback if no valid terms
    if (summarized.length === 0) {
        console.warn('No valid terms after summarization');
        return [];
    }

    // Sort by metric (descending)
    const sorted = summarized.sort((a, b) => {
        // Handle cases where metric might be undefined
        const valA = a[metric] || 0;
        const valB = b[metric] || 0;
        return valB - valA;
    });

    // Dynamic K calculation if not provided
    const finalK = K || Math.min(
        Math.max(20, Math.floor(Math.sqrt(validTerms.length))), // Minimum 20, max sqrt(N)
        500 // Absolute maximum
    );

    // Balance selection between high-score and mid-range terms
    const topTerms = sorted.slice(0, Math.floor(finalK * 0.7)); // Top 70%
    const diverseTerms = sorted.slice(
        Math.floor(finalK * 0.7), 
        Math.floor(finalK * 0.7) + Math.floor(finalK * 0.3) // Next 30%
    );

    const selectedTerms = [...topTerms, ...diverseTerms];
    
    // Final validation
    return selectedTerms.slice(0, finalK).filter(term => 
        term && 
        term.name && 
        typeof term[metric] === 'number'
    );
}

module.exports = { selectKBest };