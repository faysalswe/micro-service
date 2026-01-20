import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';

export function setupSwagger(app: Express) {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Payment Service API',
        version: '1.0.0',
        description: 'REST API for Payment Service',
      },
      servers: [
        {
          url: `http://localhost:${process.env.REST_PORT}`,
        },
      ],
    },
    apis: ['./src/rest-api.ts'], // Fixed path to rest-api.ts
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
