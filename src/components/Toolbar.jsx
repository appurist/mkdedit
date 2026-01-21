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
      <h1>mkdedit</h1>
      <div class="view-toggle">
        <button
          class={`btn-toggle ${props.viewMode() === 'source' ? 'active' : ''}`}
          onClick={() => props.onViewModeChange('source')}
        >
          Source
        </button>
        <button
          class={`btn-toggle ${props.viewMode() === 'split' ? 'active' : ''}`}
          onClick={() => props.onViewModeChange('split')}
        >
          Split
        </button>
        <button
          class={`btn-toggle ${props.viewMode() === 'rendered' ? 'active' : ''}`}
          onClick={() => props.onViewModeChange('rendered')}
        >
          Rendered
        </button>
      </div>
      <div class="file-controls">
        <span class="current-file">{displayName()}</span>
        <button class="btn" onClick={props.onOpen}>Open</button>
        <button class="btn" onClick={props.onNew}>New</button>
        <button class="btn btn-primary" onClick={props.onSave}>Save</button>
        <button class="btn" onClick={props.onSaveAs}>Save As</button>
      </div>
    </header>
  )
}
