use dirs;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};

use crate::{log_json, Counter, DebugMessages, DebugPayload};

#[derive(Serialize, Deserialize)]
pub struct Payload {
    pub prompt: String,
    pub files: Vec<String>,
    pub dst: String,
}

#[derive(Serialize, Deserialize)]
pub struct IPCMessage {
    #[serde(rename = "type")]
    pub message_type: String,
    pub data: serde_json::Value,
    pub timestamp: Option<u64>,
    pub id: Option<String>,
}

// Core command handlers
#[tauri::command]
pub fn submit_prompt(prompt: &str, files: Vec<String>, dst: &str, window: tauri::Window) {
    log_json(
        "info",
        "submit_prompt command called",
        Some(serde_json::json!({
            "prompt": prompt,
            "files": files,
            "dst": dst
        })),
    );

    let payload = Payload {
        prompt: prompt.to_string(),
        files,
        dst: dst.to_string(),
    };
    let json_payload = serde_json::to_string(&payload).unwrap();

    log_json(
        "info",
        "Sending JSON payload to stdout",
        Some(serde_json::json!({
            "payload_length": json_payload.len()
        })),
    );
    println!("{}", json_payload);
    let _ = window.app_handle().exit(0);
}

#[tauri::command]
pub fn log_error_to_console(error: &str) {
    eprintln!("[WebView ERROR forwarded]: {}", error);
}

#[tauri::command]
pub fn resolve_path_relative_to_home(absolute_path: String) -> Result<String, String> {
    let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let path_to_resolve = std::path::Path::new(&absolute_path);
    let relative_path = pathdiff::diff_paths(path_to_resolve, home_dir)
        .ok_or_else(|| "Failed to calculate relative path from home directory".to_string())?;
    Ok(relative_path.to_string_lossy().to_string())
}

// Debug message handlers
#[tauri::command]
pub fn add_debug_message(
    message: String,
    level: String,
    data: Option<serde_json::Value>,
    state: tauri::State<'_, DebugMessages>,
) -> Result<(), String> {
    log_json(&level, &format!("Frontend: {}", message), data.clone());

    let debug_payload = DebugPayload {
        level,
        message,
        data,
    };

    let mut messages = state.0.lock().unwrap();
    messages.push(debug_payload);

    if messages.len() > 100 {
        let len = messages.len();
        messages.drain(0..len - 100);
    }

    Ok(())
}

#[tauri::command]
pub fn get_debug_messages(
    state: tauri::State<'_, DebugMessages>,
) -> Result<Vec<DebugPayload>, String> {
    let messages = state.0.lock().unwrap();
    Ok(messages.clone())
}

#[tauri::command]
pub fn clear_debug_messages(state: tauri::State<'_, DebugMessages>) -> Result<(), String> {
    let mut messages = state.0.lock().unwrap();
    messages.clear();
    Ok(())
}

// Counter handlers (legacy)
#[tauri::command]
pub fn increment_counter(state: tauri::State<'_, Counter>) -> Result<u32, String> {
    let mut counter = state.0.lock().unwrap();
    *counter += 1;
    Ok(*counter)
}

#[tauri::command]
pub fn get_counter(state: tauri::State<'_, Counter>) -> Result<u32, String> {
    let counter = state.0.lock().unwrap();
    Ok(*counter)
}

#[tauri::command]
pub fn reset_counter(state: tauri::State<'_, Counter>) -> Result<u32, String> {
    let mut counter = state.0.lock().unwrap();
    *counter = 0;
    Ok(0)
}

// IPC communication handlers
#[tauri::command]
pub fn send_ipc_message(
    message_type: String,
    data: serde_json::Value,
    _window: tauri::Window,
) -> Result<(), String> {
    let ipc_message = IPCMessage {
        message_type,
        data,
        timestamp: Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        ),
        id: Some(format!(
            "msg_{}_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis(),
            rand::random::<u32>()
        )),
    };

    let json_message = serde_json::to_string(&ipc_message).unwrap();
    println!("{}", json_message);

    Ok(())
}

#[tauri::command]
pub fn send_message_to_stdout(message: String) -> Result<(), String> {
    println!("{}", message);
    Ok(())
}

// Image generation handlers
#[tauri::command]
pub fn generate_image_via_backend(
    prompt: String,
    files: Vec<String>,
    dst: String,
) -> Result<(), String> {
    let request = serde_json::json!({
        "type": "generate_request",
        "prompt": prompt,
        "files": files,
        "dst": dst,
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    });

    println!("{}", serde_json::to_string(&request).unwrap());

    Ok(())
}

#[tauri::command]
pub fn request_config_from_images(_app: tauri::AppHandle) -> Result<(), String> {
    let request = serde_json::json!({
        "type": "config_request",
        "timestamp": std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    });

    println!("{}", serde_json::to_string(&request).unwrap());

    Ok(())
}

#[tauri::command]
pub fn request_file_deletion(path: String) -> Result<(), String> {
    let request = serde_json::json!({
        "type": "delete_request",
        "path": path,
    });

    println!("{}", serde_json::to_string(&request).unwrap());

    Ok(())
}

// Legacy direct handlers (not used via stdin)
#[tauri::command]
pub fn forward_config_to_frontend(
    prompt: Option<String>,
    dst: Option<String>,
    api_key: Option<String>,
    files: Vec<String>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let config_data = serde_json::json!({
        "prompt": prompt,
        "dst": dst,
        "apiKey": api_key,
        "files": files
    });

    if let Err(e) = app.emit("config-received", &config_data) {
        return Err(format!("Failed to emit config: {}", e));
    }

    Ok(())
}

#[tauri::command]
pub fn forward_image_to_frontend(
    base64: String,
    mime_type: String,
    filename: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let image_data = serde_json::json!({
        "base64": base64,
        "mimeType": mime_type,
        "filename": filename
    });

    if let Err(e) = app.emit("image-received", &image_data) {
        return Err(format!("Failed to emit image: {}", e));
    }

    Ok(())
}
