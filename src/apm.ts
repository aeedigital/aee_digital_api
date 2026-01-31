import apm from 'elastic-apm-node';

// Inicia o agente APM
apm.start({
  serviceName: process.env.ELASTIC_APM_SERVICE_NAME || 'my-nest-app',
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN || '',
  serverUrl: process.env.ELASTIC_APM_SERVER_URL || 'http://localhost:8200',
  environment: process.env.NODE_ENV || 'development',

  // Configurações para evitar fila cheia
  maxQueueSize: 4096, // Fila muito maior

  // Sampling agressivo para reduzir volume
  transactionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5, // 10% em produção

  // Desativa capturas desnecessárias
  captureBody: 'off',
  captureHeaders: false,
  centralConfig: false,
  // Tolera erros do APM Server
  errorOnAbortedRequests: false,
});

export default apm;