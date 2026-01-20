import { createSignal } from 'solid-js'
import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

export function useFileSystem() {
  const [currentFile, setCurrentFile] = createSignal(null)
  const [currentFilePath, setCurrentFilePath] = createSignal(null)
  const [isDirty, setIsDirty] = createSignal(false)

  // Always true in Tauri - native dialogs always work
  const supportsFileSystemAccess = true

  function extractFilename(path) {
    if (!path) return null
    return path.split(/[/\\]/).pop()
  }

  async function openFile() {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Markdown',
          extensions: ['md']
        }]
      })

      // User cancelled
      if (selected === null) {
        return null
      }

      const content = await readTextFile(selected)

      setCurrentFilePath(selected)
      setCurrentFile(extractFilename(selected))
      setIsDirty(false)

      return content
    } catch (error) {
      console.error('File open error:', error)
      return null
    }
  }

  async function saveFile(content) {
    const path = currentFilePath()
    if (path) {
      try {
        await writeTextFile(path, content)
        setIsDirty(false)
        return true
      } catch (error) {
        console.error('Failed to save file:', error)
        return false
      }
    }

    return saveAsFile(content)
  }

  async function saveAsFile(content) {
    try {
      const selected = await save({
        defaultPath: currentFile() || 'document.md',
        filters: [{
          name: 'Markdown',
          extensions: ['md']
        }]
      })

      // User cancelled
      if (selected === null) {
        return false
      }

      await writeTextFile(selected, content)

      setCurrentFilePath(selected)
      setCurrentFile(extractFilename(selected))
      setIsDirty(false)

      return true
    } catch (error) {
      console.error('Failed to save file:', error)
      return false
    }
  }

  function newFile() {
    setCurrentFile(null)
    setCurrentFilePath(null)
    setIsDirty(false)
  }

  function markDirty() {
    setIsDirty(true)
  }

  // Set file state from CLI argument (content already read by Rust)
  function setOpenFile(path) {
    setCurrentFilePath(path)
    setCurrentFile(extractFilename(path))
    setIsDirty(false)
  }

  return {
    currentFile,
    currentFilePath,
    isDirty,
    supportsFileSystemAccess,
    openFile,
    saveFile,
    saveAsFile,
    newFile,
    markDirty,
    setIsDirty,
    setOpenFile
  }
}
