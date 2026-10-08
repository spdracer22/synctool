export const emptySourcesConfigExample = `{
  "sources": []
}`;

export const minimalLocalSourceExample = `{
  "sources": [
    {
      "type": "local",
      "path": "../shared",
      "mappings": [
        {
          "from": "skills",
          "to": ".agents/skills"
        }
      ]
    }
  ]
}`;

export function formatHelpExamples(): string {
	return `
Configuration examples:

Empty sources (no-op reference sync run):

${emptySourcesConfigExample}

Minimal local source:

${minimalLocalSourceExample}
`.trimEnd();
}
