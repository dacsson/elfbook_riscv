use std::sync::Mutex;

#[derive(Debug)]
pub struct AppState {
    settings: String
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            settings: "".to_string(),
        }
    }
}

pub struct AppMutex(pub Mutex<AppState>);