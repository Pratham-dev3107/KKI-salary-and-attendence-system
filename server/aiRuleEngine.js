/**
 * AI Rule Engine - Uses Gemini API to parse natural language salary rules
 * Supports English and Hindi input
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `You are a salary rule parser for a factory attendance & payroll system. 
Your job is to convert natural language instructions (in English OR Hindi) into a structured JSON rule.

The system has these worker metrics available:
- present_days: number of full present days
- short_days: number of short/half days
- absent_days: number of absent days
- ot_hours: total overtime hours (regular weekdays)
- sunday_ot_hours: total Sunday overtime hours
- sunday_worked_days: number of Sundays the worker came to work
- total_hours: total worked hours in the month
- monthly_salary: worker's base monthly salary
- late_days: number of days worker was late (same as short_days)

Available condition_type values:
- "always" (always applies, no condition)
- "present_days_gt" (present days greater than X)
- "present_days_lt" (present days less than X)
- "ot_hours_gt" (OT hours greater than X)
- "ot_hours_lt" (OT hours less than X)
- "absent_days_gt" (absent days greater than X)
- "absent_days_lt" (absent days less than X)
- "sunday_worked_gt" (Sunday worked days greater than X)
- "late_days_gt" (late/short days greater than X)
- "total_hours_gt" (total hours greater than X)
- "salary_gt" (monthly salary greater than X)
- "salary_lt" (monthly salary less than X)

Available action_type values:
- "add_fixed" (add a fixed amount as bonus)
- "deduct_fixed" (deduct a fixed amount)
- "add_percentage" (add X% of monthly salary as bonus)
- "deduct_percentage" (deduct X% of monthly salary)

Available rule_type values:
- "bonus" (adds money)
- "deduction" (removes money)
- "attendance_bonus" (bonus based on attendance)
- "penalty" (penalty/fine)

You MUST respond with ONLY valid JSON (no markdown, no explanation), in this exact format:
{
  "rule_name": "Short descriptive name for the rule",
  "rule_type": "bonus|deduction|attendance_bonus|penalty",
  "condition_type": "one of the condition types above",
  "condition_value": "numeric threshold value as string",
  "action_type": "one of the action types above",
  "action_value": numeric_amount,
  "applies_to_day": "all",
  "description": "Human-readable description of what this rule does (in the same language as input)"
}

Examples:
Input: "Agar koi worker 25 din se zyada aaye toh usko 1000 rupay bonus do"
Output: {"rule_name":"Full Attendance Bonus ₹1000","rule_type":"attendance_bonus","condition_type":"present_days_gt","condition_value":"25","action_type":"add_fixed","action_value":1000,"applies_to_day":"all","description":"25 din se zyada present hone par ₹1000 bonus milega"}

Input: "If absent more than 3 days, deduct 500 rupees"
Output: {"rule_name":"Absence Penalty ₹500","rule_type":"penalty","condition_type":"absent_days_gt","condition_value":"3","action_type":"deduct_fixed","action_value":500,"applies_to_day":"all","description":"If absent more than 3 days, ₹500 will be deducted"}

Input: "har worker ko 5% salary bonus do"
Output: {"rule_name":"5% Salary Bonus","rule_type":"bonus","condition_type":"always","condition_value":"0","action_type":"add_percentage","action_value":5,"applies_to_day":"all","description":"Sabhi workers ko monthly salary ka 5% bonus milega"}`;

/**
 * Parse a natural language rule using Gemini API
 * @param {string} prompt - Natural language rule description (English or Hindi)
 * @param {string} apiKey - Gemini API key
 * @returns {Object} Parsed rule object
 */
async function parseNaturalLanguageRule(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add your API key in Settings.');
  }

  if (!prompt || prompt.trim().length < 5) {
    throw new Error('Please provide a valid rule description (at least 5 characters).');
  }

  const models = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  let lastError = null;
  let response = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      contents: [
        {
          parts: [
            { text: SYSTEM_PROMPT },
            { text: `Parse this salary rule:\n"${prompt.trim()}"` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      }
    };

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        lastError = null;
        break; // Success!
      } else {
        const errText = await response.text();
        lastError = `Model ${model} error (${response.status}): ${errText}`;
        if (response.status === 429) {
          // Rate limited, try next model
          continue;
        } else {
          break;
        }
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  if (!response || !response.ok) {
    if (lastError && lastError.includes('429')) {
      throw new Error('Gemini Free Tier Rate Limit Exceeded (429). Google ka free tier limit cross ho gaya hai. Bas 1 minute ruko aur dobara try karo ya Google AI Studio se nayi free key bana lo!');
    }
    throw new Error(lastError || 'Gemini API call failed.');
  }

  const data = await response.json();

  // Extract the text response
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('Gemini API returned empty response. Please try again.');
  }

  // Parse JSON from response
  let parsed;
  try {
    // Try direct JSON parse first
    parsed = JSON.parse(textContent);
  } catch (e) {
    // Try to extract JSON from markdown code block
    const jsonMatch = textContent.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1]);
    } else {
      // Try to find JSON object in text
      const objMatch = textContent.match(/\{[\s\S]*\}/);
      if (objMatch) {
        parsed = JSON.parse(objMatch[0]);
      } else {
        throw new Error('Could not parse Gemini response as JSON');
      }
    }
  }

  // Validate required fields
  const requiredFields = ['rule_name', 'rule_type', 'condition_type', 'action_type', 'action_value'];
  for (const field of requiredFields) {
    if (!parsed[field] && parsed[field] !== 0) {
      throw new Error(`Gemini response missing required field: ${field}`);
    }
  }

  // Ensure numeric values
  parsed.action_value = parseFloat(parsed.action_value) || 0;
  parsed.condition_value = String(parsed.condition_value || '0');
  parsed.applies_to_day = parsed.applies_to_day || 'all';

  return parsed;
}

module.exports = {
  parseNaturalLanguageRule,
};
