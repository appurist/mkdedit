use tauri::{Emitter, Manager};

#[derive(Clone, serde::Serialize)]
struct OpenFilePayload {
    path: String,
    content: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut initial_file: Option<OpenFilePayload> = None;

    // Check for file path argument
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 && !args[1].starts_with('-') {
        let file_path = std::path::Path::new(&args[1]);
        let absolute_path = if file_path.is_absolute() {
            file_path.to_path_buf()
        } else {
            std::env::current_dir()
                .unwrap_or_default()
                .join(file_path)
        };
        if let Ok(canonical) = absolute_path.canonicalize() {
            if let Ok(content) = std::fs::read_to_string(&canonical) {
                if let Some(path_str) = canonical.to_str() {
                    initial_file = Some(OpenFilePayload {
                        path: path_str.to_string(),
                        content,
                    });
                }
            }
        }
    }

    tauri::Builder::default()
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
