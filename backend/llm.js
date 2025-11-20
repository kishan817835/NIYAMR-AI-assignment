

const { OpenAI } = require("openai");


const MODEL = "openai/gpt-4o";
const MAX_TOKENS = 1000;
const TEMPERATURE = 0.2;


function createOpenAIClient(apiKey) {
  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "PDF Rule Checker"
    }
  });
}

// Initialize client
let client;
try {
  client = createOpenAIClient(process.env.OPENROUTER_API_KEY);
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error.message);
  process.exit(1);
}


async function processRule(rule, text, client) {
  const prompt = `You are checking a PDF document based on a rule.

PDF Text (first 2000 chars):
${text.substring(0, 2000)}

Rule to check:
${rule}

Respond ONLY with a JSON object in this format:
{
  "status": "pass" or "fail" or "inconclusive",
  "evidence": "Relevant text from the PDF",
  "reasoning": "Brief explanation of why the rule passed/failed",
  "confidence": 0-100
}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from API');
    }

    // Safely parse JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${content}`);
    }

    // Validate response structure
    if (!['pass', 'fail', 'inconclusive'].includes(result.status)) {
      throw new Error(`Invalid status: ${result.status}`);
    }

    return {
      rule,
      status: result.status,
      evidence: result.evidence || '',
      reasoning: result.reasoning || 'No reasoning provided',
      confidence: Math.min(100, Math.max(0, result.confidence || 0))
    };
  } catch (error) {
    console.error(`Error processing rule: ${rule}`, error);
    return {
      rule,
      status: 'error',
      evidence: '',
      reasoning: `Processing error: ${error.message}`,
      confidence: 0
    };
  }
}

/**
 * Checks multiple rules against the provided text using OpenRouter
 */
async function checkRulesWithLLM(text, rules) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input');
  }
  
  if (!Array.isArray(rules) || rules.length === 0) {
    throw new Error('No rules provided');
  }

  const results = [];
  
  // Process rules sequentially to avoid rate limiting
  for (const rule of rules) {
    if (typeof rule !== 'string' || !rule.trim()) {
      results.push({
        rule: String(rule || ''),
        status: 'error',
        evidence: '',
        reasoning: 'Invalid rule format',
        confidence: 0
      });
      continue;
    }

    try {
      // Add a small delay between requests
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const result = await processRule(rule, text, client);
      results.push(result);
    } catch (error) {
      console.error(`Unexpected error processing rule: ${rule}`, error);
      results.push({
        rule,
        status: 'error',
        evidence: '',
        reasoning: `Unexpected error: ${error.message}`,
        confidence: 0
      });
    }
  }

  return results;
}

module.exports = { checkRulesWithLLM };
