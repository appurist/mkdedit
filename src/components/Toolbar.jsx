import { Show } from 'solid-js'

export default function Toolbar(props) {
  const displayName = () => {
    const file = props.currentFile()
    const dirty = props.isDirty()
    if (file) {
      return `${file}${dirty ? ' *' : ''}`
    }
    return 'No file selected'
  }

  return (
    <header class="toolbar">
      <h1>Markdown Editor</h1>
      <div class="file-controls">
        <span class="current-file">{displayName()}</span>
        <button class="btn" onClick={props.onOpen}>Open</button>
        <button class="btn" onClick={props.onNew}>New</button>
        <button class="btn btn-primary" onClick={props.onSave}>Save</button>
        <button class="btn" onClick={props.onSaveAs}>Save As</button>
      </div>
      <Show when={!props.supportsFileSystemAccess}>
        <div class="browser-notice">
          For native file dialogs, use Chrome/Edge 86+ or Firefox with flag enabled
        </div>
      </Show>
    </header>
  )
}
