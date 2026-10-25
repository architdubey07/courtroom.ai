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
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
                logger.info("Initialized Google GenAI client.")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI client: {e}")

        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
            try:
                from openai import OpenAI
                kwargs = {"api_key": settings.OPENAI_API_KEY.strip()}
                if settings.OPENAI_BASE_URL and settings.OPENAI_BASE_URL.strip():
                    kwargs["base_url"] = settings.OPENAI_BASE_URL.strip()
                self.openai_client = OpenAI(**kwargs)
                logger.info("Initialized OpenAI client.")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")

    def is_configured(self) -> bool:
        active = settings.provider
        if active == "gemini":
            return self.gemini_client is not None
        if active == "openai":
            return self.openai_client is not None
        return False

    async def generate_response(self, system_instruction: str, user_content: str = "") -> str:
        prompt_text = f"{system_instruction}\n\n{user_content}".strip()
        active = settings.provider

        if active == "gemini" and self.gemini_client:
            return await self._call_gemini(prompt_text, is_json=False)
        elif active == "openai" and self.openai_client:
            return await self._call_openai(system_instruction, user_content, is_json=False)
        else:
            raise HTTPException(
                status_code=503,
                detail=(
                    "LLM API key not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY "
                    "in the backend/.env file to start generating courtroom arguments."
                )
            )

    async def generate_json_response(self, system_instruction: str, user_content: str = "") -> Dict[str, Any]:
        prompt_text = f"{system_instruction}\n\n{user_content}".strip()
        active = settings.provider

        if active == "gemini" and self.gemini_client:
            raw_text = await self._call_gemini(prompt_text, is_json=True)
        elif active == "openai" and self.openai_client:
            raw_text = await self._call_openai(system_instruction, user_content, is_json=True)
        else:
            raise HTTPException(
                status_code=503,
                detail="LLM API key not configured on the server."
            )

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

    async def _call_gemini(self, prompt: str, is_json: bool = False) -> str:
        model_name = settings.default_model
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            
            def _run():
                kwargs = {
                    "model": model_name,
                    "contents": prompt,
                }
                if is_json:
                    from google.genai import types
                    kwargs["config"] = types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                response = self.gemini_client.models.generate_content(**kwargs)
                return response.text

            return await loop.run_in_executor(None, _run)
        except Exception as e:
            logger.error(f"Gemini API error ({model_name}): {e}")
            err_msg = self._classify_and_sanitize_error("Gemini", model_name, str(e))
            raise HTTPException(status_code=502, detail=err_msg)

    async def _call_openai(self, system_instruction: str, user_content: str, is_json: bool = False) -> str:
        model_name = settings.default_model
        try:
            import asyncio
            loop = asyncio.get_event_loop()

            messages = [{"role": "system", "content": system_instruction}]
            if user_content:
                messages.append({"role": "user", "content": user_content})
            else:
                messages.append({"role": "user", "content": "Please proceed with your submission."})

            def _run():
                kwargs = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0.7,
                }
                if is_json:
                    kwargs["response_format"] = {"type": "json_object"}
                completion = self.openai_client.chat.completions.create(**kwargs)
                return completion.choices[0].message.content or ""

            return await loop.run_in_executor(None, _run)
        except Exception as e:
            logger.error(f"OpenAI API error ({model_name}): {e}")
            err_msg = self._classify_and_sanitize_error("OpenAI", model_name, str(e))
            raise HTTPException(status_code=502, detail=err_msg)

    @staticmethod
    def _classify_and_sanitize_error(provider: str, model_name: str, err_str: str) -> str:
        low = err_str.lower()
        if "404" in low or "not_found" in low or "not found" in low:
            return f"The configured AI model '{model_name}' is not found or not available for {provider}."
        if "429" in low or "resource_exhausted" in low or "quota" in low or "rate" in low:
            return f"{provider} quota or rate limit exceeded. Please check your account quota."
        if "401" in low or "403" in low or "unauthenticated" in low or "permission_denied" in low or "invalid api key" in low:
            return f"{provider} API key is invalid or unauthorized. Please verify the key in backend/.env."
        if "timeout" in low or "timed out" in low:
            return f"{provider} request timed out. Please try again."

        # Redact any key presence
        clean = err_str.replace(settings.GEMINI_API_KEY or "___none___", "[REDACTED]")
        clean = clean.replace(settings.OPENAI_API_KEY or "___none___", "[REDACTED]")
        return f"AI Provider error ({provider}): {clean[:200]}"

llm_service = LLMService()
