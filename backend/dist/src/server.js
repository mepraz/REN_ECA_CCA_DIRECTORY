"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongodb_js_1 = require("./lib/mongodb.js");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const organization_js_1 = __importDefault(require("./routes/organization.js"));
const user_js_1 = __importDefault(require("./routes/user.js"));
const event_js_1 = __importDefault(require("./routes/event.js"));
const google_js_1 = __importDefault(require("./routes/google.js"));
const uploadPath_js_1 = require("./lib/uploadPath.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const uploadRoot = (0, uploadPath_js_1.getEventUploadRoot)();
// Middlewares
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/uploads/events", express_1.default.static(uploadRoot));
// Connection to DB
(0, mongodb_js_1.dbConnect)().catch((err) => {
    console.error("Failed to connect to database on startup:", err);
});
// Routes
app.use("/api/auth", auth_js_1.default);
app.use("/api/users", user_js_1.default);
app.use("/api/organizations", organization_js_1.default);
app.use("/api/events", event_js_1.default);
app.use("/api/google", google_js_1.default);
// Health check route
app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
