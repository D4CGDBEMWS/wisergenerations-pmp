// AI training crawlers asked to stay out in robots.txt.
// Owner ruling 2026-10-30: AI assistants that fetch a page for a person
// (ChatGPT-User, OAI-SearchBot, Claude-Web, PerplexityBot) stay allowed, to
// match the Vercel Firewall setting AI Assistants = Log, so they can read and
// recommend the book.
// See app/robots.ts for the owner ruling.
export const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot',
  'meta-externalagent',
  'FacebookBot',
  'cohere-ai',
  'Diffbot',
  'Omgilibot',
  'ImagesiftBot',
  'Timpibot',
] as const
