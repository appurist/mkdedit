// Server API for file operations
import { promises as fs } from 'fs'
import { join, dirname } from 'path'

// File operations
get('/api/files/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    const filePath = join(process.cwd(), 'docs', filename)
    const content = await fs.readFile(filePath, 'utf-8')
    return c.json({ content, filename })
  } catch (error) {
    return c.json({ error: 'File not found' }, 404)
  }
})

post('/api/files/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    const { content } = await c.req.json()
    const filePath = join(process.cwd(), 'docs', filename)
    
    // Ensure directory exists
    await fs.mkdir(dirname(filePath), { recursive: true })
    
    // Save file
    await fs.writeFile(filePath, content, 'utf-8')
    return c.json({ success: true, filename })
  } catch (error) {
    return c.json({ error: 'Could not save file' }, 500)
  }
})

get('/api/files', async (c) => {
  try {
    const docsDir = join(process.cwd(), 'docs')
    await fs.mkdir(docsDir, { recursive: true })
    const files = await fs.readdir(docsDir)
    const markdownFiles = files.filter(file => file.endsWith('.md'))
    return c.json({ files: markdownFiles })
  } catch (error) {
    return c.json({ files: [] })
  }
})

// Nuemark rendering endpoint
post('/api/render', async (c) => {
  const { markdown } = await c.req.json()
  
  try {
    // Import Nuemark for rendering (this will be available in Nue environment)
    const { renderMarkdown } = await import('nuemark')
    
    const html = await renderMarkdown(markdown)
    return c.json({ html })
  } catch (error) {
    // If Nuemark is not available, provide a basic fallback
    console.log('Nuemark not available, using basic rendering')
    
    const basicHtml = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><blockquote>/g, '<blockquote>')
      .replace(/<\/blockquote><\/p>/g, '</blockquote>')
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p><ol>/g, '<ol>')
      .replace(/<\/ol><\/p>/g, '</ol>')
      .replace(/<p><li>/g, '<li>')
      .replace(/<\/li><\/p>/g, '</li>')
    
    return c.json({ html: basicHtml })
  }
})

// Configuration endpoint for client-side settings
get('/api/config', async (c) => {
  return c.json({
    linguix: {
      enabled: true,
      // In production, this should come from environment variables
      // For now, return null so the client prompts for API key
      api_key: process.env.LINGUIX_API_KEY || null
    }
  })
})