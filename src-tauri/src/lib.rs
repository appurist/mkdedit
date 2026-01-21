use tauri::{Emitter, Manager};
#[cfg(target_os = "macos")]
use tauri::RunEvent;

#[derive(Clone, serde::Serialize)]
struct OpenFilePayload {
    path: String,
    content: String,
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
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut initial_file: Option<OpenFilePayload> = None;

    // Check for file path argument (Linux/Windows CLI)
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 && !args[1].starts_with('-') {
        initial_file = read_file_payload(&args[1]);
    }

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            if let Some(payload) = initial_file.clone() {
                let main_window = app.get_webview_window("main").unwrap();
                // Delay to let frontend initialize
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = main_window.emit("open-file", payload);
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        // Handle macOS "Open With" file associations
        #[cfg(target_os = "macos")]
        if let RunEvent::Opened { urls } = &event {
            for url in urls {
                // Convert file:// URL to path
                if let Ok(path) = url.to_file_path() {
                    if let Some(path_str) = path.to_str() {
                        if let Some(payload) = read_file_payload(path_str) {
                            // Clone handle to use in spawned thread
                            let handle = app_handle.clone();
                            // Delay to let window and frontend initialize (Opened fires before Ready)
                            std::thread::spawn(move || {
                                std::thread::sleep(std::time::Duration::from_millis(1000));
                                if let Some(window) = handle.get_webview_window("main") {
                                    let _ = window.emit("open-file", payload);
                                }
                            });
                        }
                    }
                }
            }
        }
        let _ = (app_handle, event); // Suppress unused warnings on non-macOS
    });
}
