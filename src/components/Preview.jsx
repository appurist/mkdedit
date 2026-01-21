import { Show } from 'solid-js'

export default function Preview(props) {
  const isFullWidth = () => props.viewMode && props.viewMode() === 'rendered'

  return (
    <div
      class={`preview-pane ${isFullWidth() ? 'preview-full' : ''}`}
      style={{ flex: `0 0 ${props.width()}%` }}
    >
      <div class="preview-content">
        <Show
          when={props.html()}
          fallback={!isFullWidth() && <p class="empty-state">Start typing markdown to see the preview...</p>}
        >
          <div innerHTML={props.html()} />
        </Show>
      </div>
    </div>
  )
}
