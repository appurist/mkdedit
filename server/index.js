// Server-side Nuemark rendering
import { nuemark } from 'nuemark'

// Nuemark rendering endpoint
post('/api/render', async (c) => {
  try {
    const { markdown } = await c.req.json()
    
    // Use server-side Nuemark where node_modules is accessible
    // nuemark() returns HTML directly, not an object
    const html = nuemark(markdown)
    
    return c.json({ html })
  } catch (error) {
    console.error('Server-side Nuemark rendering failed:', error)
    return c.json({ error: 'Rendering failed' }, 500)
  }
})

// File operations endpoints
import { promises as fs } from 'fs'
import { join, dirname } from 'path'

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