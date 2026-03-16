export interface SearchInput {
  query: string;
}

export function searchPrompt(input: SearchInput): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a knowledge base search engine for a software project managed with betterspec.
You will receive the project's full knowledge base as context (architecture, patterns, capabilities, decisions, glossary).
Search this knowledge and return relevant results ranked by relevance.

Format your response as a list of results:

### Result 1
- **Source**: capability | decision | pattern | architecture | glossary
- **Title**: [title]
- **Relevance**: [1-2 sentence explanation of why this matches]
- **Snippet**: [relevant excerpt]

### Result 2
...

If nothing matches, say so clearly. Return at most 10 results, ordered by relevance.`;

  const userPrompt = `Search the project knowledge base for: "${input.query}"`;

  return { systemPrompt, userPrompt };
}
