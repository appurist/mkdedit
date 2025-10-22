// Markdown Editor Application
class MarkdownEditor {
  constructor() {
    this.currentFile = null
    this.currentFileHandle = null // For File System Access API
    this.isDirty = false
    this.supportsFileSystemAccess = 'showOpenFilePicker' in window
    this.grammarCheckEnabled = false
    this.linguixInstance = null
    
    this.initializeElements()
    this.bindEvents()
    this.updateUIForFileSystemSupport()
    this.initializeLinguix()
    this.createNewFile() // Start with a blank file
  }
  
  initializeElements() {
    this.editor = document.getElementById('editor')
    this.preview = document.getElementById('preview')
    this.currentFileNameEl = document.getElementById('currentFileName')
    this.openFileBtn = document.getElementById('openFile')
    this.newFileBtn = document.getElementById('newFile')
    this.saveFileBtn = document.getElementById('saveFile')
    this.saveAsFileBtn = document.getElementById('saveAsFile')
    this.grammarCheckBtn = document.getElementById('grammarCheck')
    this.splitter = document.getElementById('splitter')
  }
  
  bindEvents() {
    // Editor input event for live preview
    this.editor.addEventListener('input', () => {
      this.markDirty()
      this.updatePreview()
    })
    
    // Open file button
    this.openFileBtn.addEventListener('click', () => {
      this.openFile()
    })
    
    // New file button
    this.newFileBtn.addEventListener('click', () => {
      this.createNewFile()
    })
    
    // Save file button
    this.saveFileBtn.addEventListener('click', () => {
      this.saveFile()
    })
    
    // Save As file button
    this.saveAsFileBtn.addEventListener('click', () => {
      this.saveAsFile()
    })
    
    // Grammar check toggle
    this.grammarCheckBtn.addEventListener('click', () => {
      this.toggleGrammarCheck()
    })
    
    // Splitter drag functionality
    this.initializeSplitter()
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        this.saveFile()
      }
    })
  }
  
  initializeSplitter() {
    let isResizing = false
    
    this.splitter.addEventListener('mousedown', (e) => {
      isResizing = true
      document.addEventListener('mousemove', this.handleSplitterMove.bind(this))
      document.addEventListener('mouseup', () => {
        isResizing = false
        document.removeEventListener('mousemove', this.handleSplitterMove.bind(this))
      })
    })
  }
  
  handleSplitterMove(e) {
    const container = document.querySelector('.editor-container')
    const rect = container.getBoundingClientRect()
    const percentage = ((e.clientX - rect.left) / rect.width) * 100
    
    if (percentage > 10 && percentage < 90) {
      const editorPane = document.querySelector('.editor-pane')
      const previewPane = document.querySelector('.preview-pane')
      
      editorPane.style.flex = `0 0 ${percentage}%`
      previewPane.style.flex = `0 0 ${100 - percentage}%`
    }
  }
  
  
  createNewFile() {
    this.editor.value = ''
    this.currentFile = null
    this.currentFileHandle = null
    this.markClean() // New file starts clean
    this.updatePreview()
    this.updateTitle()
    this.updateCurrentFileName()
  }
  
  async openFile() {
    if (!this.supportsFileSystemAccess) {
      alert('File System Access API is not supported in this browser. Please use Chrome 86+, Edge 86+, or enable the flag in Firefox.')
      return
    }
    
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }],
        multiple: false,
        startIn: 'documents'
      })
      
      const file = await fileHandle.getFile()
      const content = await file.text()
      
      this.editor.value = content
      this.currentFile = file.name
      this.currentFileHandle = fileHandle
      this.markClean()
      this.updatePreview()
      this.updateTitle()
      this.updateCurrentFileName()
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to open file:', error)
        alert('Failed to open file')
      }
    }
  }
  
  async saveAsFile() {
    if (!this.supportsFileSystemAccess) {
      alert('File System Access API is not supported in this browser. Please use Chrome 86+, Edge 86+, or enable the flag in Firefox.')
      return
    }
    
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: this.currentFile || 'document.md',
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }],
        startIn: 'documents'
      })
      
      const writable = await fileHandle.createWritable()
      await writable.write(this.editor.value)
      await writable.close()
      
      this.currentFile = fileHandle.name
      this.currentFileHandle = fileHandle
      this.markClean()
      this.updateTitle()
      this.updateCurrentFileName()
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to save file:', error)
        alert('Failed to save file')
      }
    }
  }
  
  async saveFile() {
    if (!this.supportsFileSystemAccess) {
      alert('File System Access API is not supported in this browser. Please use Chrome 86+, Edge 86+, or enable the flag in Firefox.')
      return
    }
    
    // If we have a file handle, use it
    if (this.currentFileHandle) {
      try {
        const writable = await this.currentFileHandle.createWritable()
        await writable.write(this.editor.value)
        await writable.close()
        
        this.markClean()
        this.updateTitle()
        return
      } catch (error) {
        console.error('Failed to save with file handle:', error)
        alert('Failed to save file')
        return
      }
    }
    
    // If no current file, use Save As dialog
    return this.saveAsFile()
  }
  
  markDirty() {
    this.isDirty = true
    this.updateTitle()
    this.updateCurrentFileName()
  }
  
  markClean() {
    this.isDirty = false
    this.updateTitle()
    this.updateCurrentFileName()
  }
  
  updateTitle() {
    const title = this.currentFile 
      ? `${this.currentFile}${this.isDirty ? ' *' : ''} - Markdown Editor`
      : 'Markdown Editor'
    document.title = title
  }
  
  updateCurrentFileName() {
    const displayName = this.currentFile 
      ? `${this.currentFile}${this.isDirty ? ' *' : ''}`
      : 'No file selected'
    this.currentFileNameEl.textContent = displayName
  }
  
  updateUIForFileSystemSupport() {
    if (!this.supportsFileSystemAccess) {
      // Show a message about browser compatibility
      console.log('File System Access API not supported, using fallback methods')
      
      // You could add a notice to the UI here if desired
      const toolbar = document.querySelector('.toolbar')
      const notice = document.createElement('div')
      notice.style.fontSize = '0.8rem'
      notice.style.color = '#666'
      notice.textContent = 'For native file dialogs, use Chrome/Edge 86+ or Firefox with flag enabled'
      toolbar.appendChild(notice)
    }
  }
  
  async initializeLinguix() {
    try {
      // Check if Linguix SDK is available
      if (typeof LinguixCheckerSDK === 'undefined') {
        console.log('Linguix SDK not loaded')
        this.grammarCheckBtn.disabled = true
        this.grammarCheckBtn.title = 'Linguix SDK not available'
        return
      }
      
      // Prompt user for API key
      const apiKey = prompt('Enter your Linguix API key (get one from https://developer.linguix.com/):')
      
      if (!apiKey) {
        console.log('No Linguix API key provided')
        this.grammarCheckBtn.disabled = true
        this.grammarCheckBtn.title = 'Linguix API key required'
        return
      }
      
      // Initialize Linguix SDK
      await LinguixCheckerSDK.initialize({ 
        apiKey: apiKey,
        language: 'en-US'
      })
      
      console.log('Linguix SDK initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Linguix:', error)
      this.grammarCheckBtn.disabled = true
      this.grammarCheckBtn.title = 'Linguix initialization failed'
    }
  }
  
  toggleGrammarCheck() {
    if (this.grammarCheckBtn.disabled) {
      alert('Grammar checking is not available. Please check your Linguix API key.')
      return
    }
    
    this.grammarCheckEnabled = !this.grammarCheckEnabled
    
    if (this.grammarCheckEnabled) {
      this.enableGrammarCheck()
    } else {
      this.disableGrammarCheck()
    }
    
    // Update button appearance
    this.grammarCheckBtn.classList.toggle('active', this.grammarCheckEnabled)
  }
  
  enableGrammarCheck() {
    try {
      // Attach Linguix to the editor textarea
      this.linguixInstance = LinguixCheckerSDK.attachToElement(this.editor)
      console.log('Grammar checking enabled')
    } catch (error) {
      console.error('Failed to enable grammar checking:', error)
      this.grammarCheckEnabled = false
      this.grammarCheckBtn.classList.remove('active')
      alert('Failed to enable grammar checking')
    }
  }
  
  disableGrammarCheck() {
    try {
      if (this.linguixInstance) {
        // Detach Linguix from the editor
        this.linguixInstance.destroy()
        this.linguixInstance = null
      }
      console.log('Grammar checking disabled')
    } catch (error) {
      console.error('Failed to disable grammar checking:', error)
    }
  }
  
  updatePreview() {
    const markdown = this.editor.value
    if (!markdown.trim()) {
      this.preview.innerHTML = '<p class="empty-state">Start typing markdown to see the preview...</p>'
      return
    }
    
    // Use client-side markdown rendering
    this.preview.innerHTML = this.basicMarkdownToHtml(markdown)
  }
  
  basicMarkdownToHtml(markdown) {
    // Basic markdown parser as fallback
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><blockquote>/g, '<blockquote>')
      .replace(/<\/blockquote><\/p>/g, '</blockquote>')
  }
}

// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MarkdownEditor()
})