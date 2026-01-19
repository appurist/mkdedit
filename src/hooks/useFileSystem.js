import { createSignal } from 'solid-js'

export function useFileSystem() {
  const [currentFile, setCurrentFile] = createSignal(null)
  const [currentFileHandle, setCurrentFileHandle] = createSignal(null)
  const [isDirty, setIsDirty] = createSignal(false)

  const supportsFileSystemAccess = 'showOpenFilePicker' in window

  function getStartInDirectory() {
    const hasUsedBefore = localStorage.getItem('lastFileLocation')
    return hasUsedBefore ? undefined : 'documents'
  }

  function updateLastFileLocation(fileHandle) {
    if (fileHandle) {
      localStorage.setItem('lastFileLocation', 'true')
    }
  }

  function getUnsupportedMessage() {
    return `File System Access API is not supported in this browser.\n\n` +
      `Supported browsers:\n` +
      `- Chrome 86+ or Edge 86+\n` +
      `- Firefox: Enable 'dom.fs.enabled' in about:config\n` +
      `- Safari: Not yet supported\n\n` +
      `Current browser: ${navigator.userAgent.split(' ')[0]}`
  }

  async function openFile() {
    if (!supportsFileSystemAccess) {
      alert(getUnsupportedMessage())
      return null
    }

    try {
      const startIn = getStartInDirectory()
      const options = {
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }],
        multiple: false
      }

      if (startIn) {
        options.startIn = startIn
      }

      const [fileHandle] = await window.showOpenFilePicker(options)
      const file = await fileHandle.getFile()
      const content = await file.text()

      setCurrentFile(file.name)
      setCurrentFileHandle(fileHandle)
      updateLastFileLocation(fileHandle)
      setIsDirty(false)

      return content
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('File picker error:', error)
        alert(`Failed to open file: ${error.message}`)
      }
      return null
    }
  }

  async function saveFile(content) {
    if (!supportsFileSystemAccess) {
      alert(getUnsupportedMessage())
      return false
    }

    const handle = currentFileHandle()
    if (handle) {
      try {
        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()
        setIsDirty(false)
        return true
      } catch (error) {
        console.error('Failed to save with file handle:', error)
        alert('Failed to save file')
        return false
      }
    }

    return saveAsFile(content)
  }

  async function saveAsFile(content) {
    if (!supportsFileSystemAccess) {
      alert(getUnsupportedMessage())
      return false
    }

    try {
      const startIn = getStartInDirectory()
      const options = {
        suggestedName: currentFile() || 'document.md',
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }]
      }

      if (startIn) {
        options.startIn = startIn
      }

      const fileHandle = await window.showSaveFilePicker(options)
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      setCurrentFile(fileHandle.name)
      setCurrentFileHandle(fileHandle)
      updateLastFileLocation(fileHandle)
      setIsDirty(false)

      return true
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to save file:', error)
        alert('Failed to save file')
      }
      return false
    }
  }

  function newFile() {
    setCurrentFile(null)
    setCurrentFileHandle(null)
    setIsDirty(false)
  }

  function markDirty() {
    setIsDirty(true)
  }

  return {
    currentFile,
    currentFileHandle,
    isDirty,
    supportsFileSystemAccess,
    openFile,
    saveFile,
    saveAsFile,
    newFile,
    markDirty,
    setIsDirty
  }
}
