const { getConnection } = require('./config'); // ajusta o path se estiver noutra pasta

// Salva o modelo treinado no MySQL como JSON
async function saveTrainedModel(modelName, trainedData) {
    const connection = await getConnection();
    try {
        const jsonData = JSON.stringify(trainedData);
        await connection.execute(
            'INSERT INTO trained_models (model_name, trained_json) VALUES (?, ?)',
            [modelName, jsonData]
        );
        console.log(`Modelo "${modelName}" guardado na bd.`);
    } finally {
        await connection.end();
    }
}

// Carrega o modelo mais recente do MySQL
async function loadLatestTrainedModel(modelName) {
    const connection = await getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT trained_json FROM trained_models WHERE model_name = ? ORDER BY created_at DESC LIMIT 1',
            [modelName]
        );

        if (rows.length > 0) {
            console.log(`Modelo "${modelName}" carregado da base de dados.`);
            //console.log('Tipo de trained_json:', typeof rows[0].trained_json);
            //console.log('Valor de trained_json:', rows[0].trained_json);
            return rows[0].trained_json;
        } else {
            console.log(`Nenhum modelo "${modelName}" encontrado na bd.`);
            return null;
        }

    } finally {
        await connection.end();
    }
}

module.exports = {
    saveTrainedModel,
    loadLatestTrainedModel
};
