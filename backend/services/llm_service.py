import logging
import json
import re
from typing import Optional, Dict, Any
from fastapi import HTTPException
from config import settings

logger = logging.getLogger("courtroom.llm")

class LLMService:
    def __init__(self):
        self.gemini_client = None
        self.openai_client = None
        self._init_clients()

    def _init_clients(self):
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
                logger.info("Initialized Google GenAI client.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")

        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                kwargs = {"api_key": settings.OPENAI_API_KEY.strip()}
                if settings.OPENAI_BASE_URL:
                    kwargs["base_url"] = settings.OPENAI_BASE_URL.strip()
                self.openai_client = OpenAI(**kwargs)
                logger.info("Initialized OpenAI client.")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")

    def is_configured(self) -> bool:
        return self.gemini_client is not None or self.openai_client is not None

    async def generate_response(self, system_instruction: str, user_content: str = "") -> str:
        prompt_text = f"{system_instruction}\n\n{user_content}".strip()

        if self.gemini_client:
            return await self._call_gemini(prompt_text)
        elif self.openai_client:
            return await self._call_openai(system_instruction, user_content)
        else:
            raise HTTPException(
                status_code=503,
                detail=(
                    "LLM API key not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY "
                    "in the backend/.env file to start generating courtroom arguments."
                )
            )

    async def generate_json_response(self, system_instruction: str, user_content: str = "") -> Dict[str, Any]:
        raw_text = await self.generate_response(system_instruction, user_content)
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        try:
            return json.loads(cleaned)
        except Exception:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            logger.error(f"Failed to parse LLM response as JSON. Raw output: {raw_text[:300]}")
            raise HTTPException(
                status_code=502,
                detail="Failed to generate a valid structured verdict from the LLM provider."
            )

    async def _call_gemini(self, prompt: str) -> str:
        try:
            model_name = settings.LLM_MODEL or "gemini-2.5-flash"
            import asyncio
            loop = asyncio.get_event_loop()
            
            def _run():
                response = self.gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                return response.text

            return await loop.run_in_executor(None, _run)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"AI Provider error (Gemini): {self._sanitize_error(str(e))}"
            )

    async def _call_openai(self, system_instruction: str, user_content: str) -> str:
        try:
            model_name = settings.LLM_MODEL or "gpt-4o-mini"
            import asyncio
            loop = asyncio.get_event_loop()

            messages = [{"role": "system", "content": system_instruction}]
            if user_content:
                messages.append({"role": "user", "content": user_content})
            else:
                messages.append({"role": "user", "content": "Please proceed with your submission."})

            def _run():
                completion = self.openai_client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.7,
                )
                return completion.choices[0].message.content or ""

            return await loop.run_in_executor(None, _run)
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise HTTPException(
                status_code=502,
                detail=f"AI Provider error (OpenAI/Compatible): {self._sanitize_error(str(e))}"
            )

    @staticmethod
    def _sanitize_error(err_str: str) -> str:
        clean = err_str.replace(settings.GEMINI_API_KEY or "___none___", "[REDACTED]")
        clean = clean.replace(settings.OPENAI_API_KEY or "___none___", "[REDACTED]")
        return clean[:300]

llm_service = LLMService()
