/*
    Agrupa os termos com o mesmo nome
    Para cada grupo, calcula:
        sumVector → soma dos campos
        ou avgVector → média dos campos
    Ordena pelo metric escolhido (e.g.: tfidf)
    Retorna os K melhores termos
*/

function selectKBest(termArray, K, metric = 'tfidf', method = 'sum') {
    if (!['binary', 'occurrences', 'tf', 'tfidf'].includes(metric)) {
        throw new Error("Métrica inválida. Use binary, occurrences, tf ou tfidf.");
    }

    const grouped = termArray.reduce((acc, term) => {
        if (!acc[term.name]) acc[term.name] = [];
        acc[term.name].push(term);
        return acc;
    }, {});

    const bag = require('./bagOfWords');

    const summarized = Object.values(grouped).map(group => 
        method === 'avg' ? bag.avgVector(group) : bag.sumVector(group)
    );

    const sorted = summarized
        .filter(term => term && typeof term[metric] === 'number')
        .sort((a, b) => b[metric] - a[metric]);

    return sorted.slice(0, Math.max(K, 10));
}

module.exports = { selectKBest };

