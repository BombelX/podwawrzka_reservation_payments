"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
// @ts-ignore: missing type declarations for 'swagger-jsdoc'
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
exports.swaggerSpec = (0, swagger_jsdoc_1.default)({
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
