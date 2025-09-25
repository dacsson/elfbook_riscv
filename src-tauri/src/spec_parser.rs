use std::fmt::Debug;
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use std::process::Command;

use rayon::iter::{IntoParallelIterator, ParallelIterator};

#[derive(Debug)]
pub enum PdfError {
    Io(std::io::Error),
    Exists,
    NotFound,
}

pub fn pdf_to_text(file_path: &str) -> Result<String, PdfError> {
    let path = PathBuf::from(file_path);
    let dir_with_pdf = path.parent().unwrap();
    let output = dir_with_pdf.join("spec_parsed.txt");

    // Return if "spec_parsed.txt" already exists.
    if output.exists() {
        return Err(PdfError::Exists);
    }

    let pdftotext = Command::new("pdftotext")
        .args(&[file_path, output.to_str().unwrap()])
        .output()
        .map_err(|e| PdfError::Io(e))?;

    let text = String::from_utf8_lossy(&pdftotext.stdout);
    Ok(text.to_string())
}

pub fn find_in_doc(file_path: &str, query: &str) -> Result<Vec<String>, PdfError> {
    let mut text = String::new();
    let file = match File::open(file_path) {
        Ok(mut t) => t.read_to_string(&mut text),
        Err(_) => return Err(PdfError::NotFound),
    };
    let lines: Vec<&str> = text.split("| Page").collect();

    let res: Vec<String> = lines
        .into_par_iter()
        .filter_map(|page| -> Option<String> {
            let text_lower = page.to_lowercase();
            let query_lower = query.to_lowercase();
            if text_lower.contains(&query_lower) {
                Some(page.to_string())
            } else {
                None
            }
        })
        .collect();

    Ok(res)
}

pub fn find_in_html(file_path: &str, query: &str) -> Result<Vec<String>, PdfError> {
    let mut text = String::new();
    let file = match File::open(file_path) {
        Ok(mut t) => t.read_to_string(&mut text),
        Err(_) => return Err(PdfError::NotFound),
    };

    // Cut unnecessary parts of the HTML content
    let introduction = text.find("<h2 id=\"_introduction\">1. Introduction</h2>").unwrap();
    text = text[introduction..].to_string();

    let lines: Vec<&str> = text.split("<div class=\"sect3\">").collect();

    let res: Vec<String> = lines
        .into_par_iter()
        .filter_map(|page| -> Option<String> {
            let text_lower = page.to_lowercase();
            let query_lower = query.to_lowercase();
            if text_lower.contains(&query_lower) {
                Some(page.to_string())
            } else {
                None
            }
        })
        .collect();

    Ok(res)
}
