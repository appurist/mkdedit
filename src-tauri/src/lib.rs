use std::sync::Mutex;
use tauri::State;
#[cfg(target_os = "macos")]
use tauri::{Emitter, Manager, RunEvent};

#[derive(Clone, serde::Serialize)]
struct OpenFilePayload {
    path: String,
    content: String,
}

/// A file that arrived (via CLI argument or macOS open event) before the
/// frontend was ready to receive it. The frontend collects it by calling
/// `frontend_ready` once its event listener is registered.
struct PendingFile {
    file: Mutex<Option<OpenFilePayload>>,
    frontend_ready: Mutex<bool>,
}

fn read_file_payload(file_path: &str) -> Option<OpenFilePayload> {
    let path = std::path::Path::new(file_path);
    let absolute_path = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir()
            .unwrap_or_default()
            .join(path)
    };
    if let Ok(canonical) = absolute_path.canonicalize() {
        if let Ok(content) = std::fs::read_to_string(&canonical) {
            if let Some(path_str) = canonical.to_str() {
                return Some(OpenFilePayload {
                    path: path_str.to_string(),
                    content,
                });
            }
        }
    }
    eprintln!("mkdedit: could not open file argument: {file_path}");
    None
}

/// Deliver a file to the frontend: emit directly if it is already listening,
/// otherwise park it until `frontend_ready` is called.
#[cfg(target_os = "macos")]
fn deliver_file(app: &tauri::AppHandle, payload: OpenFilePayload) {
    let state: State<PendingFile> = app.state();
    let ready = *state.frontend_ready.lock().unwrap();
    if ready {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.emit("open-file", payload);
            return;
        }
    }
    *state.file.lock().unwrap() = Some(payload);
}

/// Called by the frontend once its `open-file` listener is registered.
/// Returns (and clears) any file that arrived before that point.
#[tauri::command]
fn frontend_ready(state: State<PendingFile>) -> Option<OpenFilePayload> {
    *state.frontend_ready.lock().unwrap() = true;
    let pending = state.file.lock().unwrap().take();
    log::info!(
        "frontend ready; pending file: {}",
        pending.as_ref().map_or("none", |p| p.path.as_str())
    );
    pending
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check for file path argument (CLI on any platform, `open --args` on macOS)
    let args: Vec<String> = std::env::args().collect();
    let initial_file = if args.len() > 1 && !args[1].starts_with('-') {
        read_file_payload(&args[1])
    } else {
        None
    };

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(PendingFile {
            file: Mutex::new(initial_file),
            frontend_ready: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![frontend_ready])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        // Handle macOS "Open With" / Finder / `open file.md` file associations
        #[cfg(target_os = "macos")]
        if let RunEvent::Opened { urls } = &event {
            for url in urls {
                if let Ok(path) = url.to_file_path() {
                    if let Some(path_str) = path.to_str() {
                        if let Some(payload) = read_file_payload(path_str) {
                            deliver_file(app_handle, payload);
                        }
                    }
                }
            }
        }
        let _ = (app_handle, event); // Suppress unused warnings on non-macOS
    });
}
