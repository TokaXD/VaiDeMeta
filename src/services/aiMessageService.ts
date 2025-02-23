import axios from "axios";

interface AIResponse {
  response?: string;
  done?: boolean;
}

class AIMessageService {
  private static instance: AIMessageService;
  private readonly baseUrl: string = "http://localhost:11434/api/generate";

  private constructor() {}

  public static getInstance(): AIMessageService {
    if (!AIMessageService.instance) {
      AIMessageService.instance = new AIMessageService();
    }
    return AIMessageService.instance;
  }

  private cleanResponse(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  }

  private async streamResponse(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: "deepseek-r1:7b",
          prompt: prompt,
        },
        {
          responseType: "stream",
        }
      );

      let completeResponse = "";

      for await (const chunk of response.data) {
        const lines = chunk.toString().split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data: AIResponse = JSON.parse(line);
            if (data.response) {
              completeResponse += data.response;
            }
            if (data.done) {
              break;
            }
          } catch (error) {
            console.error("Error parsing response line:", error);
          }
        }
      }

      // Clean and return the response
      return this.cleanResponse(completeResponse);
    } catch (error) {
      console.error("Error generating AI message:", error);
      return "Ops! Não consegui gerar uma mensagem agora. Tente novamente mais tarde!";
    }
  }

  public async generateTaskCompletionMessage(
    deadline: Date,
    user: string,
    titulo: string
  ): Promise<string> {
    const now = new Date();
    const isLate = now > deadline;

    const prompt = isLate
      ? `Crie uma mensagem em pt-br, bem informal e com um toque desleixado (use emojis 😜, 🤷‍♂️, etc.) que alerte o usuário ${user} por ter atrasado a tarefa "${titulo}". A mensagem deve ser motivacional, mas também cobrar o usuário de forma direta, mostrando que deixar a tarefa atrasada é uma coisa muito ruim. Incentive-o a se organizar e agir já, usando um tom descontraído e firme ao mesmo tempo.`
      : `Crie uma mensagem em pt-br, motivacional e positiva, parabenizando o ${user} por ter completado a tarefa "${titulo}" antes do prazo. Use uma linguagem informal, desleixada e inclua emojis!`;

    return this.streamResponse(prompt);
  }

  public async generateMessage(prompt: string): Promise<string> {
    return this.streamResponse(prompt);
  }
}

export default AIMessageService;
