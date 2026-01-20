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

  const fileSystem = useFileSystem()
  const { parse } = useMarkdown()

  // Update document title when file or dirty state changes
  createEffect(() => {
    const file = fileSystem.currentFile()
    const dirty = fileSystem.isDirty()
    const title = file
      ? `${file}${dirty ? ' *' : ''} - Markdown Editor`
      : 'Markdown Editor'
    document.title = title
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
  }

  async function handleOpen() {
    const fileContent = await fileSystem.openFile()
    if (fileContent !== null) {
      setContent(fileContent)
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
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
      />
      <main class="editor-container">
        <Editor
          content={content}
          onInput={handleContentChange}
          width={editorWidth}
        />
        <Splitter onResize={setEditorWidth} />
        <Preview
          html={() => parse(content())}
          width={() => 100 - editorWidth()}
        />
      </main>
    </div>
  )
}
