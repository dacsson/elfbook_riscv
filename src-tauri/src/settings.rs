use std::path::PathBuf;

#[derive(Debug)]
pub struct Settings {
    appdata_dir: PathBuf,

    /// Path to riscv-isa-manual
    path_to_isa: PathBuf
}

impl Settings {
    pub fn new(appdata_dir: PathBuf) -> Self {
        let path_to_isa = appdata_dir.join("riscv-isa-manual"); // Assuming the file is in the appdata directoryPathBuf::from("riscv-isa-manual") // Default value
        Settings {
            appdata_dir,
            path_to_isa
        }
    }

    pub fn set_path_to_isa(&mut self, path_to_isa: PathBuf) {
        self.path_to_isa = path_to_isa;
    }

    pub fn get_path_to_isa(&self) -> &PathBuf {
        &self.path_to_isa
    }

    pub fn get_settings_file_path(&self) -> PathBuf {
        self.appdata_dir.join("settings.yaml")
    }

    pub fn get_appdata_dir(&self) -> &PathBuf {
        &self.appdata_dir
    }
}