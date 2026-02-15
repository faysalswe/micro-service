import { apiReference } from '@scalar/express-api-reference';
import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';

export function setupApiDocs(app: Express) {
  const openapiOptions = {
    definition: {
      openapi: '3.1.0',
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
    apis: ['./src/rest-api.ts'], // Path to API routes with OpenAPI annotations
  };

  const openapiSpec = swaggerJsdoc(openapiOptions);

  // Serve OpenAPI spec as JSON
  app.get('/openapi.json', (_req, res) => {
    res.json(openapiSpec);
  });

  // Serve Scalar UI for interactive API documentation
  app.use('/api-docs', apiReference({
    spec: {
      content: openapiSpec
    },
  }));
}
