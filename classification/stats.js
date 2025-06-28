function createConfusionMatrix(trueLabels, predictedLabels, classes = ['positive', 'negative']) {
    const matrix = {};
    classes.forEach(actual => {
        matrix[actual] = {};
        classes.forEach(predicted => {
            matrix[actual][predicted] = 0;
        });
    });

    for (let i = 0; i < trueLabels.length; i++) {
        const actual = trueLabels[i];
        const predicted = predictedLabels[i];
        matrix[actual][predicted]++;
    }

    return matrix;
}

function calculateMetrics(matrix, classes = ['positive', 'negative']) {
    const metrics = {};

    classes.forEach(cls => {
        const TP = matrix[cls][cls];
        const FP = classes.reduce((sum, c) => c !== cls ? sum + matrix[c][cls] : sum, 0);
        const FN = classes.reduce((sum, c) => c !== cls ? sum + matrix[cls][c] : sum, 0);
        const TN = classes.reduce((sum, r) =>
            sum + classes.reduce((s, c) => {
                if (r !== cls && c !== cls) return s + matrix[r][c];
                return s;
            }, 0), 0
        );

        const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
        const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
        const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
        const accuracy = (TP + TN) / (TP + TN + FP + FN);

        metrics[cls] = {
            precision: precision.toFixed(3),
            recall: recall.toFixed(3),
            f1: f1.toFixed(3),
            accuracy: accuracy.toFixed(3),
            support: TP + FN
        };
    });

    return metrics;
}

// Macro average para ter uma visão geral do desempenho
function calculateMacroAvg(metrics, classes = ['positive', 'negative']) {
    const totals = { precision:0, recall:0, f1:0, accuracy:0 };
    classes.forEach(cls => {
        totals.precision += parseFloat(metrics[cls].precision);
        totals.recall += parseFloat(metrics[cls].recall);
        totals.f1 += parseFloat(metrics[cls].f1);
        totals.accuracy += parseFloat(metrics[cls].accuracy);
    });
    const avg = {
        precision: (totals.precision / classes.length).toFixed(3),
        recall: (totals.recall / classes.length).toFixed(3),
        f1: (totals.f1 / classes.length).toFixed(3),
        accuracy: (totals.accuracy / classes.length).toFixed(3)
    };
    return avg;
}

function printConfusionMatrix(matrix) {
    const classes = Object.keys(matrix);
    console.log('\nConfusion Matrix:');
    console.log(`\t${classes.join('\t')}`);
    classes.forEach(actual => {
        const row = [actual];
        classes.forEach(predicted => {
            row.push(matrix[actual][predicted]);
        });
        console.log(row.join('\t'));
    });
}

function printMetrics(metrics, macroAvg) {
    console.log('\nMetrics per class:');
    console.table(metrics);
    console.log('\nMacro average:');
    console.table(macroAvg);
}

module.exports = {
    createConfusionMatrix,
    calculateMetrics,
    calculateMacroAvg,
    printConfusionMatrix,
    printMetrics
};
