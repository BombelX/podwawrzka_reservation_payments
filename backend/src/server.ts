// Załaduj .env zanim pojawią się jakiekolwiek inne importy
import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { db } from "./db/client";
import { reservations } from "./db/schema";

import cors from 'cors';
import reservationsRouter from './routes/reservations';
import paymentsRouter from './routes/payments';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';

const app = express();
// CORS + logi requestów (pomaga sprawdzić, czy front w ogóle trafia do backendu)
app.use(cors());
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.json());
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/reservations", reservationsRouter);
app.use("/payments", paymentsRouter);



app.get('/', (req, res) => {
  res.send('Backend Podwawrzka działa ✅');
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));







