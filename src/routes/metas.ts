import { Router, Request, Response } from "express";
import Database from "../services/database";

const router = Router();
const db = Database.getInstance().getDatabase();

// Listar todas as metas
router.get("/", (req: Request, res: Response) => {
  const userId = req.query.userId;

  const query = userId
    ? "SELECT * FROM metas WHERE user_id = ?"
    : "SELECT * FROM metas";

  const params = userId ? [userId] : [];

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Criar nova meta
router.post("/", (req: Request, res: Response) => {
  const { titulo, descricao, user_id, data_vencimento } = req.body;
  if (!titulo || !user_id) {
    res.status(400).json({ error: "Título e ID do usuário são obrigatórios" });
    return;
  }

  db.run(
    "INSERT INTO metas (titulo, descricao, user_id, data_vencimento) VALUES (?, ?, ?, ?)",
    [titulo, descricao, user_id, data_vencimento],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        titulo,
        descricao,
        user_id,
        data_vencimento,
      });
    }
  );
});

// Atualizar meta
router.put("/:id", (req: Request, res: Response) => {
  const { titulo, descricao, concluida, data_vencimento } = req.body;
  db.run(
    "UPDATE metas SET titulo = ?, descricao = ?, concluida = ?, data_vencimento = ? WHERE id = ?",
    [titulo, descricao, concluida, data_vencimento, req.params.id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: "Meta atualizada com sucesso" });
    }
  );
});

// Deletar meta
router.delete("/:id", (req: Request, res: Response) => {
  db.run("DELETE FROM metas WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "Meta deletada com sucesso" });
  });
});

export default router;
