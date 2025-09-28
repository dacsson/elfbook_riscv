use std::fmt::{Debug, Display, Formatter};
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use rayon::iter::{IntoParallelIterator, ParallelIterator};

#[derive(Debug)]
pub enum HtmlError {
    Io(std::io::Error),
}

impl Display for HtmlError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            HtmlError::Io(e) => write!(f, "Error reading from riscv-spec.html: {}", e),
        }
    }
}

pub fn find_in_html(file_path: &PathBuf, query: &str) -> Result<Vec<String>, HtmlError> {
    let mut text = String::new();
    let _ = match File::open(file_path) {
        Ok(mut t) => t.read_to_string(&mut text),
        Err(e) => return Err(HtmlError::Io(e)),
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
