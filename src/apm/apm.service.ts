import apm from 'elastic-apm-node';

// Inicia o agente APM
apm.start({
  serviceName: process.env.ELASTIC_APM_SERVICE_NAME || 'my-nest-app',
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN || '',
  serverUrl: process.env.ELASTIC_APM_SERVER_URL || 'http://localhost:8200',
  environment: process.env.NODE_ENV || 'development',
  apiRequestTime: '60s', // Dá mais tempo para o APM responder

  // Outras configurações opcionais:
  // active: true, // para ativar/desativar a coleta
  // captureBody: 'all', // para capturar body das requisições
  // logLevel: 'info'
});

export default apm;