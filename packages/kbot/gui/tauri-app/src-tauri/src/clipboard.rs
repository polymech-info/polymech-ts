use arboard::Clipboard;
use image::{ImageBuffer, ImageFormat, Rgba};
use log::{error, info};
use std::path::PathBuf;
use tauri::ipc::Response;
use tauri::{AppHandle, Runtime};

fn save_rgba_image_to_temp(
    image_data: &arboard::ImageData,
    candidate_format: &str,
    temp_dir: &PathBuf,
) -> Result<String, Box<dyn std::error::Error>> {
    let width = image_data.width as u32;
    let height = image_data.height as u32;
    let rgba_data = &image_data.bytes;

    let expected_len = (width * height * 4) as usize;
    if rgba_data.len() != expected_len {
        return Err(format!(
            "Image data length mismatch: expected {} bytes ({}x{}x4), actual {} bytes",
            expected_len,
            width,
            height,
            rgba_data.len()
        )
        .into());
    }

    let Some(img_buffer) = ImageBuffer::<Rgba<u8>, _>::from_raw(width, height, rgba_data.to_vec())
    else {
        let error_message = format!("Failed to create ImageBuffer from raw data");
        error!("{}", error_message);
        return Err(error_message.into());
    };

    let file_name = format!("kbot_clipboard_{}.{}", nanoid::nanoid!(), candidate_format);
    let temp_path = temp_dir.join(file_name);

    img_buffer.save_with_format(
        &temp_path,
        ImageFormat::from_extension(candidate_format).unwrap_or(ImageFormat::Png),
    )?;

    Ok(temp_path.to_string_lossy().to_string())
}

async fn parse_clipboard_images(
    candidate_format: Option<String>,
    temp_dir: Option<PathBuf>,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let mut clipboard = Clipboard::new()?;
    let mut result: Vec<String> = Vec::new();
    let candidate_format = candidate_format.unwrap_or_else(|| "png".to_string());
    let temp_dir = temp_dir.unwrap_or_else(|| std::env::temp_dir());

    // Try to get image data first (screenshot, copied image)
    match clipboard.get().image() {
        Ok(image_data) => {
            info!(
                "[parse_clipboard_images] Found image data: {}x{}, {} bytes",
                image_data.width,
                image_data.height,
                image_data.bytes.len()
            );
            let temp_path = save_rgba_image_to_temp(&image_data, &candidate_format, &temp_dir)?;
            result.push(temp_path);
        }
        Err(e) => {
            info!("[parse_clipboard_images] No image data found: {}", e);

            // Try to get file list (drag and drop from explorer/finder)
            match clipboard.get().file_list() {
                Ok(file_list) => {
                    info!("[parse_clipboard_images] Found file list: {:?}", file_list);
                    for file in file_list {
                        let path_str = file.to_string_lossy().to_string();
                        // Filter for image files only
                        if path_str.to_lowercase().ends_with(".png")
                            || path_str.to_lowercase().ends_with(".jpg")
                            || path_str.to_lowercase().ends_with(".jpeg")
                            || path_str.to_lowercase().ends_with(".gif")
                            || path_str.to_lowercase().ends_with(".webp")
                        {
                            result.push(path_str);
                        }
                    }
                }
                Err(e2) => {
                    info!("[parse_clipboard_images] No file list found: {}", e2);
                }
            }
        }
    }

    Ok(result)
}

#[tauri::command]
pub async fn ipc_parse_clipboard_images<R: Runtime>(
    _app: AppHandle<R>,
    candidate_format: String,
    temp_dir: String,
) -> Response {
    let data =
        match parse_clipboard_images(Some(candidate_format), Some(PathBuf::from(temp_dir))).await {
            Ok(data) => data,
            Err(error) => {
                error!("[ipc_parse_clipboard_images] Error: {}", error);
                return Response::new(
                    serde_json::json!({
                        "success": false,
                        "error": error.to_string(),
                    })
                    .to_string(),
                );
            }
        };
    Response::new(
        serde_json::json!({
            "success": true,
            "paths": data,
        })
        .to_string(),
    )
}
