// Markdown Editor Application

class MarkdownEditor {
  constructor() {
    this.currentFile = null
    this.currentFileHandle = null // For File System Access API
    this.isDirty = false
    this.supportsFileSystemAccess = 'showOpenFilePicker' in window
    this.grammarCheckEnabled = false
    this.linguixInstance = null
    this.linguixInitialized = false

    console.log('File System Access API supported:', this.supportsFileSystemAccess)
    console.log('showOpenFilePicker available:', typeof window.showOpenFilePicker)
    console.log('showSaveFilePicker available:', typeof window.showSaveFilePicker)
    console.log('Linguix SDK available:', typeof window.Linguix?.LinguixCheckerSDK !== 'undefined')
    console.log('window.Linguix:', window.Linguix)
    console.log('All Linguix-related globals:', Object.keys(window).filter(key => key.toLowerCase().includes('linguix')))
    console.log('LinguixCheckerSDK direct:', typeof LinguixCheckerSDK !== 'undefined' ? LinguixCheckerSDK : 'undefined')
    console.log('Nuemark imported successfully:', typeof nuemark !== 'undefined')
    console.log('Chrome version:', navigator.userAgent.match(/Chrome\/(\d+)/)?.[1])
    console.log('Is secure context (HTTPS):', window.isSecureContext)

    this.initializeElements()
    this.bindEvents()
    this.updateUIForFileSystemSupport()

    // Wait a bit for Linguix SDK to load
    setTimeout(() => {
      console.log('=== After 500ms delay ===')
      console.log('window.Linguix after delay:', window.Linguix)
      console.log('All globals after delay:', Object.keys(window).filter(key => key.toLowerCase().includes('linguix')))
      this.initializeLinguix()
    }, 500)

    this.createNewFile() // Start with a blank file
  }

  getStartInDirectory() {
    // If we've opened a file before, the browser will remember the last location
    // So we can omit startIn and let the browser handle it, or use documents as fallback
    const hasUsedBefore = localStorage.getItem('lastFileLocation')
    return hasUsedBefore ? undefined : 'documents'
  }

  updateLastFileLocation(fileHandle) {
    // Mark that we've used the file picker before
    // The browser automatically remembers the last directory used
    if (fileHandle) {
      localStorage.setItem('lastFileLocation', 'true')
    }
  }

  getStoredApiKey() {
    return localStorage.getItem('linguixApiKey')
  }

  setStoredApiKey(apiKey) {
    localStorage.setItem('linguixApiKey', apiKey)
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
    console.log('openFile called, checking support...')

    if (!this.supportsFileSystemAccess) {
      const message = `File System Access API is not supported in this browser.\n\n` +
        `Supported browsers:\n` +
        `• Chrome 86+ or Edge 86+\n` +
        `• Firefox: Enable 'dom.fs.enabled' in about:config\n` +
        `• Safari: Not yet supported\n\n` +
        `Current browser: ${navigator.userAgent.split(' ')[0]}`
      alert(message)
      return
    }

    console.log('Support check passed, calling showOpenFilePicker...')

    try {
      const startIn = this.getStartInDirectory()
      const options = {
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }],
        multiple: false
      }

      // Only add startIn if we have a value (browser remembers last location if omitted)
      if (startIn) {
        options.startIn = startIn
      }

      const [fileHandle] = await window.showOpenFilePicker(options)

      const file = await fileHandle.getFile()
      const content = await file.text()

      this.editor.value = content
      this.currentFile = file.name
      this.currentFileHandle = fileHandle
      this.updateLastFileLocation(fileHandle)
      this.markClean()
      this.updatePreview()
      this.updateTitle()
      this.updateCurrentFileName()
    } catch (error) {
      console.error('File picker error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      if (error.name !== 'AbortError') {
        alert(`Failed to open file: ${error.message}`)
      }
    }
  }

  async saveAsFile() {
    if (!this.supportsFileSystemAccess) {
      const message = `File System Access API is not supported in this browser.\n\n` +
        `Supported browsers:\n` +
        `• Chrome 86+ or Edge 86+\n` +
        `• Firefox: Enable 'dom.fs.enabled' in about:config\n` +
        `• Safari: Not yet supported\n\n` +
        `Current browser: ${navigator.userAgent.split(' ')[0]}`
      alert(message)
      return
    }

    try {
      const startIn = this.getStartInDirectory()
      const options = {
        suggestedName: this.currentFile || 'document.md',
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }]
      }

      // Only add startIn if we have a value (browser remembers last location if omitted)
      if (startIn) {
        options.startIn = startIn
      }

      const fileHandle = await window.showSaveFilePicker(options)

      const writable = await fileHandle.createWritable()
      await writable.write(this.editor.value)
      await writable.close()

      this.currentFile = fileHandle.name
      this.currentFileHandle = fileHandle
      this.updateLastFileLocation(fileHandle)
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
      const message = `File System Access API is not supported in this browser.\n\n` +
        `Supported browsers:\n` +
        `• Chrome 86+ or Edge 86+\n` +
        `• Firefox: Enable 'dom.fs.enabled' in about:config\n` +
        `• Safari: Not yet supported\n\n` +
        `Current browser: ${navigator.userAgent.split(' ')[0]}`
      alert(message)
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
    console.log('Checking Linguix SDK availability...')
    console.log('window.Linguix type:', typeof window.Linguix)
    console.log('LinguixCheckerSDK type:', typeof window.Linguix?.LinguixCheckerSDK)

    // Always enable the button - let user click to trigger setup
    this.grammarCheckBtn.disabled = false

    if (!window.Linguix?.LinguixCheckerSDK) {
      console.log('Linguix SDK not available - will show error when user clicks')
      this.grammarCheckBtn.title = 'Click to enable grammar checking'
    } else {
      console.log('Linguix SDK available')
      this.grammarCheckBtn.title = 'Click to toggle grammar checking'
    }
  }

  async toggleGrammarCheck() {
    // If already enabled, just disable it
    if (this.grammarCheckEnabled) {
      this.disableGrammarCheck()
      return
    }

    // Check if SDK is available
    if (!window.Linguix?.LinguixCheckerSDK) {
      alert('Linguix SDK is not available. Please check your internet connection or try refreshing the page.')
      return
    }

    try {
      // Check for stored API key first
      let apiKey = this.getStoredApiKey()

      // If no stored key, prompt user
      if (!apiKey) {
        apiKey = prompt('Enter your Linguix API key (get one from https://developer.linguix.com/):')

        if (!apiKey) {
          console.log('No Linguix API key provided')
          return
        }

        // Store the API key for future use
        this.setStoredApiKey(apiKey)
      }

      // Initialize Linguix SDK if not already done
      if (!this.linguixInitialized) {
        await window.Linguix.LinguixCheckerSDK.initialize({
          apiKey: apiKey,
          language: 'en-US'
        })
        this.linguixInitialized = true
        console.log('Linguix SDK initialized successfully')
      }

      // Enable grammar checking
      this.enableGrammarCheck()

    } catch (error) {
      console.error('Failed to initialize Linguix:', error)
      alert('Failed to initialize grammar checking. Please check your API key.')
    }
  }

  enableGrammarCheck() {
    try {
      // Make sure we're not already attached
      if (this.linguixInstance) {
        console.log('Grammar checking already enabled')
        return
      }

      // Attach Linguix to the editor textarea
      this.linguixInstance = window.Linguix.LinguixCheckerSDK.attachToElement(this.editor)
      this.grammarCheckEnabled = true
      this.grammarCheckBtn.classList.add('active')
      console.log('Grammar checking enabled')
    } catch (error) {
      console.error('Failed to enable grammar checking:', error)
      this.grammarCheckEnabled = false
      this.grammarCheckBtn.classList.remove('active')

      // If error is about already being attached, try to recover
      if (error.message && error.message.includes('Already attached')) {
        console.log('Attempting to recover from "already attached" error')
        this.disableGrammarCheck() // Force cleanup
      } else {
        alert('Failed to enable grammar checking')
      }
    }
  }

  disableGrammarCheck() {
    try {
      if (this.linguixInstance) {
        console.log('Detaching Linguix from editor...')
        // Detach Linguix from the editor
        this.linguixInstance.destroy()
        this.linguixInstance = null
        console.log('Linguix instance destroyed')
      }
      this.grammarCheckEnabled = false
      this.grammarCheckBtn.classList.remove('active')
      console.log('Grammar checking disabled')
    } catch (error) {
      console.error('Failed to disable grammar checking:', error)
      // Force cleanup even if destroy failed
      this.linguixInstance = null
      this.grammarCheckEnabled = false
      this.grammarCheckBtn.classList.remove('active')
    }
  }

  updatePreview() {
    const markdown = this.editor.value
    if (!markdown.trim()) {
      this.preview.innerHTML = '<p class="empty-state">Start typing markdown to see the preview...</p>'
      return
    }
    
    // Use basic markdown rendering until NueJS Windows fixes are released
    this.preview.innerHTML = this.basicMarkdownToHtml(markdown)
    console.log('Rendered with basic markdown parser (waiting for NueJS Windows fixes)')
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
