export default function Editor(props) {
  return (
    <div class="editor-pane" style={{ flex: `0 0 ${props.width()}%` }}>
      <textarea
        id="editor"
        placeholder="Start typing your markdown here..."
        value={props.content()}
        onInput={(e) => props.onInput(e.target.value)}
      />
    </div>
  )
}
