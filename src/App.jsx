import { createSignal, createEffect, onMount, onCleanup } from 'solid-js'
import { listen } from '@tauri-apps/api/event'
import { useFileSystem } from './hooks/useFileSystem'
import { useMarkdown } from './hooks/useMarkdown'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Splitter from './components/Splitter'
import Preview from './components/Preview'

export default function App() {
  const [content, setContent] = createSignal('')
  const [editorWidth, setEditorWidth] = createSignal(50)
  const [viewMode, setViewMode] = createSignal('rendered') // 'source', 'split', 'rendered'

  const fileSystem = useFileSystem()
  const { parse } = useMarkdown()

  // Update document title when file or dirty state changes
  createEffect(() => {
    const file = fileSystem.currentFile()
    const dirty = fileSystem.isDirty()
    const title = file
      ? `${file}${dirty ? ' *' : ''} - mkdedit`
      : 'mkdedit'
    document.title = title
  })

  // Switch to split view if no file is loaded after startup
  onMount(() => {
    setTimeout(() => {
      if (!fileSystem.currentFile() && !content()) {
        setViewMode('split')
      }
    }, 1200) // Wait for CLI/Open With file to load
  })

  // Keyboard shortcut: Ctrl+S to save
  onMount(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown))

    // Listen for file open from CLI argument (Rust sends path + content)
    const setupListener = async () => {
      const unlisten = await listen('open-file', (event) => {
        const { path, content: fileContent } = event.payload
        fileSystem.setOpenFile(path)
        setContent(fileContent)
        setViewMode('rendered')
      })
      onCleanup(() => unlisten())
    }
    setupListener()
  })

  function handleContentChange(newContent) {
    setContent(newContent)
    fileSystem.markDirty()
  }

  function handleNew() {
    setContent('')
    fileSystem.newFile()
    setViewMode('split')
  }

  async function handleOpen() {
    const fileContent = await fileSystem.openFile()
    if (fileContent !== null) {
      setContent(fileContent)
      setViewMode('rendered')
    }
  }

  async function handleSave() {
    await fileSystem.saveFile(content())
  }

  async function handleSaveAs() {
    await fileSystem.saveAsFile(content())
  }

  return (
    <div class="app">
      <Toolbar
        currentFile={fileSystem.currentFile}
        isDirty={fileSystem.isDirty}
        supportsFileSystemAccess={fileSystem.supportsFileSystemAccess}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
      />
      <main class="editor-container">
        {(viewMode() === 'source' || viewMode() === 'split') && (
          <Editor
            content={content}
            onInput={handleContentChange}
            width={() => viewMode() === 'split' ? editorWidth() : 100}
            viewMode={viewMode}
          />
        )}
        {viewMode() === 'split' && (
          <Splitter onResize={setEditorWidth} />
        )}
        {(viewMode() === 'rendered' || viewMode() === 'split') && (
          <Preview
            html={() => parse(content())}
            width={() => viewMode() === 'split' ? 100 - editorWidth() : 100}
            viewMode={viewMode}
          />
        )}
      </main>
    </div>
  )
}
