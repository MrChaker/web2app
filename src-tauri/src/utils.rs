pub fn check_file_or_append(file_path: &str) -> String {
    let mut output_path = file_path.to_string();
    let mut i = 1;
    while std::path::Path::new(&output_path).exists() {
        output_path = format!("{} ({})", file_path, i);
        i += 1;
    }
    output_path
}
