use serde::{Deserialize, Serialize};
mod handlers;
mod stdin_processor;

// Desktop-only modules
#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod clipboard;
use tauri::Manager;

pub use handlers::*;

// Desktop-only exports
#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub use clipboard::*;

#[derive(Serialize)]
struct LogMessage {
    level: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<serde_json::Value>,
    timestamp: u64,
}

pub fn log_json(level: &str, message: &str, data: Option<serde_json::Value>) {
    let log_msg = LogMessage {
        level: level.to_string(),
        message: message.to_string(),
        data: data.filter(|v| !v.is_null()), // Filter out null values to avoid undefined in logs
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };
    eprintln!(
        "{}",
        serde_json::to_string(&log_msg).unwrap_or_else(|_| format!(
            "{{\"level\":\"error\",\"message\":\"Failed to serialize log message\"}}"
        ))
    );
}

// App state structures
pub struct Counter(pub std::sync::Mutex<u32>);
pub struct DebugMessages(pub std::sync::Mutex<Vec<DebugPayload>>);

#[derive(Serialize, Deserialize, Clone)]
pub struct DebugPayload {
    pub level: String,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .manage(Counter(std::sync::Mutex::new(0)))
        .manage(DebugMessages(std::sync::Mutex::new(Vec::new())))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init());

    // Desktop-only plugins
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_shell::init())
            .plugin(tauri_plugin_process::init())
            .plugin(tauri_plugin_upload::init())
            .plugin(tauri_plugin_clipboard_manager::init());
    }

    // Desktop invoke handlers (includes clipboard functions)
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let app = builder.invoke_handler(tauri::generate_handler![
        submit_prompt,
        log_error_to_console,
        resolve_path_relative_to_home,
        increment_counter,
        get_counter,
        reset_counter,
        add_debug_message,
        get_debug_messages,
        clear_debug_messages,
        send_message_to_stdout,
        send_ipc_message,
        request_config_from_images,
        forward_config_to_frontend,
        forward_image_to_frontend,
        generate_image_via_backend,
        request_file_deletion,
        ipc_parse_clipboard_images
    ]);

    // Mobile invoke handlers (no clipboard functions)
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let app = builder.invoke_handler(tauri::generate_handler![
        submit_prompt,
        log_error_to_console,
        resolve_path_relative_to_home,
        increment_counter,
        get_counter,
        reset_counter,
        add_debug_message,
        get_debug_messages,
        clear_debug_messages,
        send_message_to_stdout,
        send_ipc_message,
        request_config_from_images,
        forward_config_to_frontend,
        forward_image_to_frontend,
        generate_image_via_backend,
        request_file_deletion
    ]);

    let app = app
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            let app_handle = app.handle().clone();

            // Start stdin listener in separate module
            stdin_processor::start_stdin_listener(app_handle);

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        _ => {}
    });
}
