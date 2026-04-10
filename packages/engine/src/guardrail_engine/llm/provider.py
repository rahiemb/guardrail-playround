"""LiteLLM Provider abstraction."""

from __future__ import annotations

import os

import litellm

from guardrail_engine.pipeline.models import LLMConfig

_PROVIDER_ENV_KEYS: dict[str, str] = {
    "openai":    "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "azure":     "AZURE_API_KEY",
    "cohere":    "COHERE_API_KEY",
    "groq":      "GROQ_API_KEY",
    "mistral":   "MISTRAL_API_KEY",
}


class LLMProvider:
    """Wrapper around LiteLLM for generating text."""

    async def generate_async(self, prompt: str, config: LLMConfig) -> str:
        """Generate text asynchronously using LiteLLM."""

        # Assemble model string. If provider is given and not openai, LiteLLM prefers 'provider/model'
        mode_str = config.model
        if config.provider and config.provider.lower() != "openai" and "/" not in mode_str:
            mode_str = f"{config.provider}/{config.model}"

        kwargs = {
            "model": mode_str,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
        }

        # Override API keys at the call level if provided (session keys)
        api_key = config.api_key
        if not api_key and config.provider:
            env_var = _PROVIDER_ENV_KEYS.get(config.provider.lower())
            if env_var:
                api_key = os.environ.get(env_var)
        if not api_key:
            api_key = os.environ.get("LITELLM_API_KEY")

        if api_key:
            kwargs["api_key"] = api_key

        base_url = os.environ.get("LITELLM_API_URL") or os.environ.get("LITELLM_BASE_URL")
        if base_url:
            kwargs["base_url"] = base_url

        response = await litellm.acompletion(**kwargs)

        return response.choices[0].message.content or ""
