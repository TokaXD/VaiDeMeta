import { Router, Request, Response } from "express";
import Database from "../services/database";
import * as bcrypt from "bcrypt";

const router = Router();
const db = Database.getInstance().getDatabase();

// Listar todos os usuários
router.get("/", (req: Request, res: Response) => {
  db.all("SELECT id, name, email, created_at FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Registrar novo usuário
router.post("/", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          res.status(400).json({ error: "Email já cadastrado" });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.status(201).json({
        id: this.lastID,
        name,
        email,
        created_at: new Date().toISOString(),
      });
    }
  );
});

// Buscar usuário por ID
router.get("/:id", (req: Request, res: Response) => {
  db.get(
    "SELECT id, name, email, created_at FROM users WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }
      res.json(row);
    }
  );
});

export default router;
