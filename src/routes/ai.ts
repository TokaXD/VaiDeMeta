import { Router, Request, Response, NextFunction } from "express";
import AIMessageService from "../services/aiMessageService";
import { error } from "console";

interface CompletionRequest extends Request {
  body: {
    deadline: string;
    user: string;
    titulo: string;
  };
}

const router = Router();

router.post(
  "/completion-message",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deadline, user, titulo } = req.body;
      const aiService = AIMessageService.getInstance();

      const dueDate = new Date(deadline);
      const message = await aiService.generateTaskCompletionMessage(
        dueDate,
        user,
        titulo
      );
      res.json({ message });
    } catch (error) {
      console.error("Error generating AI message:", error);
      next(error);
    }
  }
);

export default router;
