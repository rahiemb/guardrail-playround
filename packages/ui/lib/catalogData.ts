export interface GuardrailCatalogEntry {
  id: string
  name: string
  icon: string
  description: string
  category: string
  categoryColor: string
  useCases: string[]
  configParams: { name: string; type: string; description: string }[]
  performanceNote: string
}

export const CATALOG: GuardrailCatalogEntry[] = [
  {
    id: 'pii',
    name: 'PII Detector',
    icon: '🔒',
    category: 'Privacy',
    categoryColor: '#8b5cf6',
    description: 'Detects and redacts personally identifiable information using Microsoft Presidio. Supports names, emails, phone numbers, SSNs, credit cards, dates, locations, and more.',
    useCases: [
      'Scrub customer data before sending to LLMs',
      'GDPR / HIPAA compliance enforcement',
      'Anonymize user inputs in support systems',
    ],
    configParams: [
      { name: 'entities', type: 'string[]', description: 'PII entity types to detect (PERSON, EMAIL_ADDRESS, PHONE_NUMBER, US_SSN, CREDIT_CARD, …)' },
      { name: 'language', type: 'string', description: 'Language code for NER model (default: "en")' },
      { name: 'action', type: 'redact | block', description: 'Whether to redact matched entities or block the entire input' },
    ],
    performanceNote: 'Loads a spaCy NER model on first use (~200 ms cold start). Subsequent calls are fast (<10 ms).',
  },
  {
    id: 'toxicity',
    name: 'Toxicity Filter',
    icon: '🛡️',
    category: 'Safety',
    categoryColor: '#ef4444',
    description: 'Scores text across six toxicity dimensions using the detoxify ML model: toxicity, severe toxicity, obscenity, identity attack, insult, and threat.',
    useCases: [
      'Block harmful or abusive inputs from end users',
      'Moderate AI-generated content before display',
      'Flag borderline content for human review',
    ],
    configParams: [
      { name: 'threshold', type: 'number (0-1)', description: 'Score above which content is considered toxic (default: 0.5). Lower = stricter.' },
      { name: 'categories', type: 'string[]', description: 'Specific toxicity dimensions to check (default: all)' },
    ],
    performanceNote: 'Runs a transformer model. First inference ~500 ms (model load), subsequent ~50-100 ms per call.',
  },
  {
    id: 'prompt_injection',
    name: 'Prompt Injection Detector',
    icon: '⚠️',
    category: 'Security',
    categoryColor: '#f59e0b',
    description: 'Detects prompt injection, jailbreak, and system-prompt-extraction attempts using a curated heuristic pattern library with configurable sensitivity.',
    useCases: [
      'Block DAN / jailbreak attempts in chat apps',
      'Protect system prompts from extraction',
      'Harden multi-turn agent pipelines',
    ],
    configParams: [
      { name: 'sensitivity', type: 'number (0-1)', description: 'Detection sensitivity threshold. Higher = more patterns trigger (default: 0.75).' },
    ],
    performanceNote: 'Pure regex/heuristic — no model load. Sub-millisecond on typical inputs.',
  },
  {
    id: 'regex',
    name: 'Regex Filter',
    icon: '🔍',
    category: 'Content',
    categoryColor: '#3b82f6',
    description: 'Matches text against a configurable regular expression. Can block matching content or modify it via replacement string. Supports all Python re flags.',
    useCases: [
      'Detect credit card numbers, SSNs, or custom patterns',
      'Block internal code names or proprietary terms',
      'Enforce output format constraints via pattern matching',
    ],
    configParams: [
      { name: 'pattern', type: 'string', description: 'Python regex pattern to match against input text' },
      { name: 'flags', type: 'string', description: 'Regex flags: i (case-insensitive), m (multiline), s (dotall)' },
      { name: 'replacement', type: 'string', description: 'If set, replaces matches instead of blocking (modify action)' },
    ],
    performanceNote: 'Pure Python regex. Effectively instant (<1 ms) for typical inputs.',
  },
  {
    id: 'keyword',
    name: 'Keyword Filter',
    icon: '🏷️',
    category: 'Content',
    categoryColor: '#3b82f6',
    description: 'Simple but powerful deny-list and allow-list keyword filtering. Can block text containing banned terms or enforce that only permitted terms are used.',
    useCases: [
      'Block competitor brand mentions',
      'Enforce on-topic responses for scoped chatbots',
      'Filter profanity or sensitive business terms',
    ],
    configParams: [
      { name: 'deny_list', type: 'string[]', description: 'Terms that trigger a block or warn action when found in text' },
      { name: 'allow_list', type: 'string[]', description: 'If set, text must contain at least one allowed term to pass' },
      { name: 'case_sensitive', type: 'boolean', description: 'Whether matching is case-sensitive (default: false)' },
    ],
    performanceNote: 'Order-n string search. Effectively instant for typical list sizes.',
  },
  {
    id: 'length',
    name: 'Length Limiter',
    icon: '📏',
    category: 'Format',
    categoryColor: '#10b981',
    description: 'Enforces minimum and maximum character or token length constraints on input or output text. Prevents overly short and overly long submissions.',
    useCases: [
      'Guard against empty or trivially short inputs',
      'Prevent prompt stuffing with extremely long inputs',
      'Control LLM context-window usage',
    ],
    configParams: [
      { name: 'min_chars', type: 'number', description: 'Minimum character count (inclusive). 0 = no minimum.' },
      { name: 'max_chars', type: 'number', description: 'Maximum character count (inclusive). 0 = no maximum.' },
      { name: 'min_tokens', type: 'number', description: 'Minimum approximate token count (optional)' },
      { name: 'max_tokens', type: 'number', description: 'Maximum approximate token count (optional)' },
    ],
    performanceNote: 'Character and token counting is instant. No model required.',
  },
  {
    id: 'topic',
    name: 'Topic Validator',
    icon: '🗂️',
    category: 'Content',
    categoryColor: '#3b82f6',
    description: 'Allows or denies input based on topic keyword groups. Each topic has an associated keyword list; if blocked topic keywords are found, the input is rejected.',
    useCases: [
      'Restrict a customer bot to product-related questions',
      'Block political or controversial topics in sensitive apps',
      'Keep a coding assistant focused on technical questions',
    ],
    configParams: [
      { name: 'blocked_topics', type: 'object', description: 'Record mapping topic names to keyword arrays (e.g. { "politics": ["election"] })' },
      { name: 'allowed_topics', type: 'object', description: 'If set, input must match at least one allowed topic to pass' },
      { name: 'case_sensitive', type: 'boolean', description: 'Whether topic keyword matching is case-sensitive (default: false)' },
    ],
    performanceNote: 'Keyword-based matching. Effectively instant.',
  },
  {
    id: 'format',
    name: 'Format Validator',
    icon: '📋',
    category: 'Format',
    categoryColor: '#10b981',
    description: 'Validates that output text conforms to a required structure: valid JSON (with optional required keys), well-formed XML, or Markdown with required headings.',
    useCases: [
      'Ensure LLM outputs parseable JSON for downstream APIs',
      'Validate XML-structured tool call responses',
      'Enforce documentation structure with required sections',
    ],
    configParams: [
      { name: 'expected_format', type: 'json | xml | markdown', description: 'The required output format type' },
      { name: 'required_keys', type: 'string[]', description: 'For JSON: top-level keys that must be present in the object' },
      { name: 'required_headings', type: 'string[]', description: 'For Markdown: headings (## text) that must appear in output' },
    ],
    performanceNote: 'JSON/XML/Markdown parsing. Effectively instant.',
  },
]
