import { onCleanup } from 'solid-js'

export default function Splitter(props) {
  let isResizing = false

  function handleMouseDown(e) {
    isResizing = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  function handleMouseMove(e) {
    if (!isResizing) return

    const container = document.querySelector('.editor-container')
    const rect = container.getBoundingClientRect()
    const percentage = ((e.clientX - rect.left) / rect.width) * 100

    if (percentage > 10 && percentage < 90) {
      props.onResize(percentage)
    }
  }

  function handleMouseUp() {
    isResizing = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  return (
    <div class="splitter" onMouseDown={handleMouseDown} />
  )
}
