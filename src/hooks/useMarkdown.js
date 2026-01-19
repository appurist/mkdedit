import { marked } from 'marked'

// Configure marked for GitHub-flavored markdown
marked.setOptions({
  gfm: true,
  breaks: true
})

// Strip YAML frontmatter (content between --- at start of file)
function stripFrontmatter(markdown) {
  const frontmatterRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/
  return markdown.replace(frontmatterRegex, '')
}

export function useMarkdown() {
  function parse(markdown) {
    if (!markdown || !markdown.trim()) {
      return ''
    }
    const content = stripFrontmatter(markdown)
    return marked.parse(content)
  }

  return { parse }
}
