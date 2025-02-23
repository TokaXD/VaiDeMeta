import express from "express";
import metasRouter from "./routes/metas";
import usersRouter from "./routes/users";
import authRouter from "./routes/auth";
import aiRouter from "./routes/ai";
import Database from "./services/database";
import path from "path";

const app = express();
const port = 3001;

// Initialize database and create tables
Database.getInstance().createUsersTable();
Database.getInstance().createMetasTable();

// Middleware para processar JSON
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

// Configurar rotas
app.use("/api/users", usersRouter);
app.use("/api/metas", metasRouter);
app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);

// Serve index.html for the root route
app.get("//", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
