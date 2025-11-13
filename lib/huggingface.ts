export interface ActionItems {
  affected: string[];
  deadlines: string[];
  actions: string[];
  relatedRegulations: string[];
  summary: string;
}

const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

export async function analyzeRegulation(
  title: string,
  source: string,
  date?: string
): Promise<ActionItems> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not configured");
  }

  const prompt = `Analyze this Indian financial/tax regulation and provide structured insights:

Regulation: ${title}
Source: ${source}
Date: ${date || "Recent"}

Provide a JSON response with:
1. "affected": List of who is impacted (e.g., "Businesses", "Individual taxpayers", "Financial advisors", "Specific sectors")
2. "deadlines": Any compliance deadlines or effective dates mentioned
3. "actions": Specific action steps that affected parties should take
4. "relatedRegulations": Related regulations or compliance areas
5. "summary": One-line impact summary

Format as valid JSON only, no markdown:
{
  "affected": [],
  "deadlines": [],
  "actions": [],
  "relatedRegulations": [],
  "summary": ""
}`;

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          top_p: 0.9,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // HF returns array with generated_text
    const generatedText = Array.isArray(result) 
      ? result[0]?.generated_text || result[0] 
      : result.generated_text || result;

    // Try to parse JSON from the response
    const jsonMatch = typeof generatedText === 'string' 
      ? generatedText.match(/\{[\s\S]*\}/) 
      : null;
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        affected: Array.isArray(parsed.affected) ? parsed.affected : [],
        deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        relatedRegulations: Array.isArray(parsed.relatedRegulations) ? parsed.relatedRegulations : [],
        summary: parsed.summary || "Impact assessment pending",
      };
    }

    // Fallback if JSON parsing fails
    return generateFallbackAnalysis(title, source);
    
  } catch (error: any) {
    console.error("[HF API] Analysis error:", error.message);
    return generateFallbackAnalysis(title, source);
  }
}

function generateFallbackAnalysis(title: string, source: string): ActionItems {
  const affected: string[] = [];
  const actions: string[] = [];
  const relatedRegulations: string[] = [];
  
  // Smart defaults based on source
  if (source.includes("Income Tax") || source.includes("CBDT")) {
    affected.push("Individual taxpayers", "Tax professionals", "Businesses");
    actions.push("Review notification details", "Consult with tax advisor", "Update compliance procedures");
    relatedRegulations.push("Income Tax Act, 1961");
  } else if (source.includes("GST") || source.includes("CBIC")) {
    affected.push("GST-registered businesses", "Tax practitioners");
    actions.push("Review GST portal for updates", "Assess impact on current filings", "Update GST compliance");
    relatedRegulations.push("GST Act");
  } else if (source.includes("RBI")) {
    affected.push("Banks", "Financial institutions", "NBFCs");
    actions.push("Review RBI circular", "Update internal policies", "Ensure compliance by deadline");
    relatedRegulations.push("Banking Regulation Act", "RBI guidelines");
  } else if (source.includes("SEBI")) {
    affected.push("Listed companies", "Stock brokers", "Investors");
    actions.push("Review SEBI circular", "Update disclosure requirements", "Assess impact on operations");
    relatedRegulations.push("SEBI regulations", "Securities laws");
  } else {
    affected.push("Businesses", "Compliance officers");
    actions.push("Review official notification", "Assess applicability", "Consult legal advisor");
  }

  return {
    affected,
    deadlines: ["Check official notification for specific dates"],
    actions,
    relatedRegulations,
    summary: "Regulatory update requiring attention",
  };
}

export async function analyzeBatch(
  items: Array<{ title: string; source: string; date?: string }>
): Promise<Map<string, ActionItems>> {
  const results = new Map<string, ActionItems>();
  
  // Analyze in parallel with rate limiting
  const batchSize = 3;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item) => analyzeRegulation(item.title, item.source, item.date))
    );
    
    batchResults.forEach((result, index) => {
      const item = batch[index];
      const key = `${item.title}|${item.source}`;
      
      if (result.status === "fulfilled") {
        results.set(key, result.value);
      } else {
        results.set(key, generateFallbackAnalysis(item.title, item.source));
      }
    });
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
