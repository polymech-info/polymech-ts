use std::io::{BufRead, BufReader};
use tauri::Emitter;

use crate::log_json;

pub fn start_stdin_listener(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        let stdin = std::io::stdin();
        let reader = BufReader::new(stdin);

        for line in reader.lines() {
            if let Ok(line_content) = line {
                if line_content.trim().is_empty() {
                    continue;
                }

                // Parse command from images.ts
                if let Ok(command) = serde_json::from_str::<serde_json::Value>(&line_content) {
                    if let Some(cmd) = command.get("cmd").and_then(|v| v.as_str()) {
                        match cmd {
                            "forward_config_to_frontend" => {
                                handle_config_forward(&command, &app_handle);
                            }
                            "forward_image_to_frontend" => {
                                handle_image_forward(&command, &app_handle);
                            }
                            "generation_result" => {
                                if let Err(e) = app_handle.emit("generation-result", &command) {
                                    log_json(
                                        "error",
                                        "Failed to emit generation-result",
                                        Some(serde_json::json!({
                                            "error": e.to_string()
                                        })),
                                    );
                                }
                            }
                            "generation_error" => {
                                if let Err(e) = app_handle.emit("generation-error", &command) {
                                    log_json(
                                        "error",
                                        "Failed to emit generation-error",
                                        Some(serde_json::json!({
                                            "error": e.to_string()
                                        })),
                                    );
                                }
                            }
                            "generation_complete" => {
                                if let Err(e) = app_handle.emit("generation-complete", &command) {
                                    log_json(
                                        "error",
                                        "Failed to emit generation-complete",
                                        Some(serde_json::json!({
                                            "error": e.to_string()
                                        })),
                                    );
                                }
                            }
                            "file_deleted_successfully" => {
                                if let Some(path) = command.get("path").and_then(|v| v.as_str()) {
                                    if let Err(e) = app_handle.emit(
                                        "file-deleted-successfully",
                                        &serde_json::json!({ "path": path }),
                                    ) {
                                        log_json(
                                            "error",
                                            "Failed to emit file-deleted-successfully",
                                            Some(serde_json::json!({
                                                "error": e.to_string()
                                            })),
                                        );
                                    }
                                }
                            }
                            "file_deletion_error" => {
                                if let (Some(path), Some(error)) = (
                                    command.get("path").and_then(|v| v.as_str()),
                                    command.get("error").and_then(|v| v.as_str()),
                                ) {
                                    if let Err(e) = app_handle.emit(
                                        "file-deletion-error",
                                        &serde_json::json!({ "path": path, "error": error }),
                                    ) {
                                        log_json(
                                            "error",
                                            "Failed to emit file-deletion-error",
                                            Some(serde_json::json!({
                                                "error": e.to_string()
                                            })),
                                        );
                                    }
                                }
                            }
                            _ => {
                                log_json(
                                    "warn",
                                    "Unknown command received",
                                    Some(serde_json::json!({
                                        "command": cmd
                                    })),
                                );
                            }
                        }
                    }
                } else {
                    log_json(
                        "warn",
                        "Failed to parse stdin as JSON",
                        Some(serde_json::json!({
                            "content_length": line_content.len()
                        })),
                    );
                }
            }
        }

        log_json("info", "Stdin listener thread ended", None);
    });
}

fn handle_config_forward(command: &serde_json::Value, app_handle: &tauri::AppHandle) {
    log_json(
        "info",
        "Forwarding config to frontend",
        Some(serde_json::json!({
            "has_prompt": command.get("prompt").is_some(),
            "has_dst": command.get("dst").is_some(),
            "has_api_key": command.get("apiKey").is_some(),
            "file_count": command.get("files").and_then(|f| f.as_array()).map(|a| a.len()).unwrap_or(0)
        })),
    );

    // Extract values, handling both null and undefined
    let prompt = command.get("prompt").and_then(|v| {
        if v.is_null() {
            None
        } else {
            v.as_str().map(|s| s.to_string())
        }
    });
    let dst = command.get("dst").and_then(|v| {
        if v.is_null() {
            None
        } else {
            v.as_str().map(|s| s.to_string())
        }
    });
    let api_key = command.get("apiKey").and_then(|v| {
        if v.is_null() {
            None
        } else {
            v.as_str().map(|s| s.to_string())
        }
    });
    let files = command
        .get("files")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|f| f.as_str().map(|s| s.to_string()))
                .collect::<Vec<String>>()
        })
        .unwrap_or_else(Vec::new);

    let config_data = serde_json::json!({
        "prompt": prompt,
        "dst": dst,
        "apiKey": api_key,
        "files": files
    });

    if let Err(e) = app_handle.emit("config-received", &config_data) {
        log_json(
            "error",
            "Failed to emit config-received",
            Some(serde_json::json!({
                "error": e.to_string()
            })),
        );
    } else {
        log_json("info", "Config emitted successfully to frontend", None);
    }
}

fn handle_image_forward(command: &serde_json::Value, app_handle: &tauri::AppHandle) {
    if let (Some(filename), Some(base64), Some(mime_type)) = (
        command.get("filename").and_then(|v| v.as_str()),
        command.get("base64").and_then(|v| v.as_str()),
        command.get("mimeType").and_then(|v| v.as_str()),
    ) {
        let image_data = serde_json::json!({
            "base64": base64,
            "mimeType": mime_type,
            "filename": filename
        });

        if let Err(e) = app_handle.emit("image-received", &image_data) {
            log_json(
                "error",
                "Failed to emit image-received",
                Some(serde_json::json!({
                    "error": e.to_string(),
                    "filename": filename
                })),
            );
        } else {
        }
    }
}
