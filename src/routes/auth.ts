import { Router, Request, Response } from "express";
import Database from "../services/database";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
}

interface JWTPayload {
  userId: number;
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

const router = Router();
const db = Database.getInstance().getDatabase();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Token validation endpoint
router.get("/validate", (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    res.status(200).json({ valid: true });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Login endpoint
router.post("/login", (req: LoginRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email e senha são obrigatórios" });
    return;
  }

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user: User | undefined) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!user) {
        res.status(401).json({ error: "Usuário não encontrado" });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        res.status(401).json({ error: "Senha inválida" });
        return;
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    }
  );
});

export default router;
