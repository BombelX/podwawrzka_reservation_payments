// @ts-ignore: missing type declarations for 'swagger-jsdoc'
import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Podwawrzka API',
      version: '1.0.0',
      description: 'API do rezerwacji i płatności',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Dev' }
    ],
    components: {
      schemas: {
        Reservation: {
          type: 'object',
          properties: {
            start: { type: 'integer' },
            end: { type: 'integer' },
          },
          required: ['start', 'end']
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' }, nullable: true }
          },
          required: ['error']
        }
      }
    }
  },

  apis: ['./src/**/*.{ts,js}'],
});
