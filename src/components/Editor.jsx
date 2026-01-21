export default function Editor(props) {
  const isFullWidth = () => props.viewMode && props.viewMode() === 'source'

  return (
    <div
      class={`editor-pane ${isFullWidth() ? 'editor-full' : ''}`}
      style={{ flex: `0 0 ${props.width()}%` }}
    >
      <textarea
        id="editor"
        placeholder="Start typing your markdown here..."
        value={props.content()}
        onInput={(e) => props.onInput(e.target.value)}
      />
    </div>
  )
}
