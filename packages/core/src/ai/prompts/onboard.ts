export function onboardPrompt(): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are generating a project onboarding guide for a new team member (human or AI agent).
You will receive the project's full knowledge base as context: architecture, patterns, capabilities, decisions, and glossary.

Write a clear, narrative walkthrough that covers:

## Project Overview
[What this project is and what problem it solves — infer from architecture and capabilities]

## Architecture
[High-level system structure — components, data flow, key integrations]

## Key Capabilities
[The most important things this project can do — pick the top 5-10]

## Patterns to Follow
[Code patterns, naming conventions, error handling patterns that are documented]

## Recent Decisions
[Important architectural or technical decisions and their rationale]

## Getting Started
[How to start contributing — reference the betterspec workflow: propose → plan → build → validate → archive]

Keep the tone professional but approachable. Aim for 2-3 pages of content. 
This should be the document someone reads on their first day working on this project.`;

  const userPrompt = `Generate a project onboarding guide from the knowledge base provided. Write it as if explaining the project to a capable developer who has never seen this codebase before.`;

  return { systemPrompt, userPrompt };
}
