"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Załaduj .env zanim pojawią się jakiekolwiek inne importy
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./swagger");
const reservations_1 = require("./routes/reservations");
const cors_1 = __importDefault(require("cors"));
const reservations_2 = __importDefault(require("./routes/reservations"));
const payments_1 = __importDefault(require("./routes/payments"));
const payments_2 = require("./routes/payments");
const settings_1 = __importDefault(require("./routes/settings"));
const app = (0, express_1.default)();
// CORS + logi requestów (pomaga sprawdzić, czy front w ogóle trafia do backendu)
app.use((0, cors_1.default)());
app.use((req, _res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    next();
});
app.use(express_1.default.json());
app.use('/swagger', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.use("/reservations", reservations_2.default);
app.use("/payments", payments_1.default);
app.use("/settings", settings_1.default);
// app.use("/emails", emialsRouter)
// app.use("/notify", SMSRouter)
app.get('/', (req, res) => {
    res.send('Backend Podwawrzka działa ✅');
});
const PORT = process.env.PORT || 3100;
app.listen(PORT, async () => {
    console.log(`Serwer działa na porcie ${PORT}`);
    try {
        await (0, reservations_1.sync3PartyReservations)();
    }
    catch (e) {
        console.error(e);
    }
    try {
        await (0, payments_2.cleanupStalePendingPayments)();
    }
    catch (e) {
        console.error(e);
    }
    setInterval(reservations_1.sync3PartyReservations, 120000);
    setInterval(() => {
        (0, payments_2.cleanupStalePendingPayments)().catch(console.error);
    }, 60000);
});
