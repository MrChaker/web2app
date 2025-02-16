pub fn check_file_or_append(file_path: &str) -> String {
    let mut output_path = file_path.to_string();
    let mut i = 1;
    while std::path::Path::new(&output_path).exists() {
        output_path = format!("{} ({})", file_path, i);
        i += 1;
    }
    output_path
}

pub fn is_file(content_type: String) -> bool {
    let file_mime_types = [
        // Text files
        "text/plain",
        "text/csv",
        "text/html",
        "text/css",
        "text/javascript",
        "application/javascript",
        // Image files
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
        "image/svg+xml",
        "image/webp",
        "image/x-icon",
        // Audio files
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/aac",
        "audio/flac",
        // Video files
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/x-msvideo",
        "video/quicktime",
        // Application files
        "application/pdf",
        "application/zip",
        "application/json",
        "application/xml",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.presentation",
        "application/rtf",
        "application/x-tar",
        "application/gzip",
        "application/x-7z-compressed",
        "application/vnd.rar",
        // Font files
        "font/ttf",
        "font/otf",
        "font/woff",
        "font/woff2",
        // Binary/executable files
        "application/octet-stream",
    ];

    file_mime_types.contains(&content_type.as_str())
}

use std::path::Path;

pub fn get_filename_from_url(url: String) -> String {
    let path = Path::new(&url);

    path.file_name()
        .and_then(|os_str| os_str.to_str())
        .map(|s| s.to_string())
        .unwrap_or("Unknown".to_string())
}
