export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 0.000003, output: 0.000015 },
  "claude-haiku-4-5-20251001": { input: 0.00000025, output: 0.00000125 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = MODEL_COSTS[model] ?? { input: 0, output: 0 };
  return rates.input * inputTokens + rates.output * outputTokens;
}
