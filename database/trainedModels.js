const { getConnection } = require('./config'); // ajusta o path se estiver noutra pasta

function getMinimalModel(trainedData) {
  const minimal = {};
  for (const className in trainedData) {
    minimal[className] = {
      vocabPerN: trainedData[className].vocabPerN,
      idfPerN: trainedData[className].idfPerN,
      topKPerN: trainedData[className].topKPerN,
      priorProbability: trainedData[className].priorProbability
      // Remove: documents, raw texts, etc.
    };
  }
  return minimal;
} 

// Salva o modelo treinado no MySQL como JSON
async function saveTrainedModel(modelName, trainedData, limit) {
    const connection = await getConnection();
    try {
        const minimalModel = getMinimalModel(trainedData); // <--- reduce size!
        const jsonData = JSON.stringify(minimalModel);
        await connection.execute(
            'INSERT INTO trained_models (model_name, trained_json, _limit) VALUES (?, ?, ?)',
            [modelName, jsonData, limit]
        );
        console.log(`Modelo "${modelName}" guardado na bd.`);
    } finally {
        await connection.end();
    }
}

// Carrega o modelo mais recente do MySQL
async function loadLatestTrainedModel(modelName, limit) {
    const connection = await getConnection();
    try {

        let sql = 'SELECT trained_json, _limit FROM eai_final_project.trained_models WHERE model_name = ? and _limit = ? ';//ORDER BY created_at DESC LIMIT 1
        const [rows] = await connection.execute(sql, [modelName, limit]);

        if (rows.length > 0) {
            console.log(`Modelo "${modelName}" com o limite ${rows[0]._limit } carregado da base de dados.`);
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
