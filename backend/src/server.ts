import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { db } from "./db/client";
import { reservations } from "./db/schema";

import cors from 'cors';
import reservationsRouter from './routes/reservations';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/reservations", reservationsRouter);


app.get('/', (req, res) => {
  res.send('Backend Podwawrzka działa ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));

const mockReservationData = [
  {
    id:1,
    start:"2024-07-01T14:00:00.000Z",
    end:"2024-07-05T10:00:00.000Z",
    arrivalTime:"2024-07-01T16:00:00.000Z",
  },
  {
    id:2,
    start:"2024-07-10T12:00:00.000Z",
    end:"2024-07-15T11:00:00.000Z",
    arrivalTime:"2024-07-10T14:00:00.000Z",
  },
  {
    id:3,
    start:"2024-07-20T12:00:00.000Z",
    end:"2024-07-25T11:00:00.000Z",
    arrivalTime:"2024-07-20T14:00:00.000Z",
  },
  {
    id:4,
    start:"2024-08-05T12:00:00.000Z",
    end:"2024-08-10T11:00:00.000Z",
    arrivalTime:"2024-08-05T14:00:00.000Z",
  },
  {
    id:5,
    start:"2024-08-10T12:00:00.000Z",
    end:"2024-08-15T11:00:00.000Z",
    arrivalTime:"2024-08-10T14:00:00.000Z",
  },


];

async function  seedMockReservations() {
  for (const mockReservation of mockReservationData) {
    const exist = await db.select().from(reservations).where(eq(reservations.id, mockReservation.id)).limit(1);
    if (!exist || (Array.isArray(exist) && exist.length === 0)) {
      await db.insert(reservations).values(mockReservation);
    }
  }
}

seedMockReservations().catch(err => {
  console.error('Seeding failed', err);
});





