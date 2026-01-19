import { Show } from 'solid-js'

export default function Preview(props) {
  return (
    <div class="preview-pane" style={{ flex: `0 0 ${props.width()}%` }}>
      <div class="preview-content">
        <Show
          when={props.html()}
          fallback={<p class="empty-state">Start typing markdown to see the preview...</p>}
        >
          <div innerHTML={props.html()} />
        </Show>
      </div>
    </div>
  )
}
