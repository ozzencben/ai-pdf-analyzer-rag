from groq import Groq
from app.core.config import settings
from loguru import logger

class LLMService:
    def __init__(self):
        # Groq istemcisini başlat
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        # Llama 3 70B modeli oldukça zekidir ve döküman analizi için harikadır
        self.model = "llama-3.3-70b-versatile"

    def ask_llm(self, query: str, context_chunks: list) -> str:
        # Context parçalarını birleştir
        context_text = "\n\n".join([getattr(c, "content", str(c)) for c in context_chunks])

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional PDF analyst. Only use the information within the given context to provide an answer."
                    },
                    {
                        "role": "user",
                        "content": f"Content:\n{context_text}\n\nQuery: {query}"
                    }
                ],
                model=self.model,
                temperature=0.2, # Daha tutarlı yanıtlar için
            )

            answer = chat_completion.choices[0].message.content or ""

            return str(answer)

        except Exception as e:
            logger.error(f"Groq API Error: {e}")
            return "A problem occurred while generating the answer."

llm_service = LLMService()