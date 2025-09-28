mod sender;
mod spec_parser;
mod state;
mod settings;

use crate::state::{AppMutex, AppState};
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[tauri::command]
fn disassemble_file(app: AppHandle, file_path: &str) {
    let objdump = Command::new("llvm-objdump-21")
        .args(&["-D", "--mattr=+d,+f,+z,+v", &file_path])
        .output()
        .map_err(|e| format!("Failed to run objdump: {}", e));

    if let Ok(dump) = objdump {
        let disasm = String::from_utf8_lossy(&dump.stdout).to_string();
        let packet = sender::Packet::new(
            sender::Event::Disassembled,
            disasm,
            sender::SendStrategy::ByChunks,
        );
        packet.send(&app);
    } else {
        let epacket = sender::Packet::new(
            sender::Event::Error,
            objdump.unwrap_err(),
            sender::SendStrategy::General,
        );
        epacket.send(&app);
    }
}

#[tauri::command]
fn hexdump_file(app: AppHandle, file_path: &str) {
    let xxd = Command::new("xxd")
        .arg("-c16") // 16 bytes per line
        .arg(&file_path)
        .output()
        .map_err(|e| format!("Failed to run xxd: {}", e));

    if let Ok(dump) = xxd {
        let hex_dump = String::from_utf8_lossy(&dump.stdout).to_string();
        let packet = sender::Packet::new(
            sender::Event::HexDumped,
            hex_dump,
            sender::SendStrategy::ByChunks,
        );
        packet.send(&app);
    }
}

#[tauri::command]
fn readelf_file(app: AppHandle, file_path: &str) {
    let readelf = Command::new("readelf")
        .args(&["-a", &file_path])
        .output()
        .map_err(|e| format!("Failed to run readelf: {}", e));

    if let Ok(dump) = readelf {
        let readelf_dump = String::from_utf8_lossy(&dump.stdout).to_string();
        let packet = sender::Packet::new(
            sender::Event::ElfInfoDumped,
            readelf_dump,
            sender::SendStrategy::ByChunks,
        );
        packet.send(&app);
    }
}

#[tauri::command]
fn read_spec(app: AppHandle, query: String) {
    tauri::async_runtime::spawn(async move {
        let state = app.state::<AppMutex>();
        let mut state = state.0.lock().unwrap();
        let riscv_isa_path = state.get_settings().get_path_to_isa();
        let text = spec_parser::find_in_html(
            &riscv_isa_path.join("build/riscv-unprivileged.html"),
            &query,
        );

        match text {
            Ok(r) => {
                let packet = sender::Packet::new(
                    sender::Event::SpecResult,
                    String::from(r.join("\n")),
                    sender::SendStrategy::ByChunks,
                );
                packet.send(&app);
            }
            Err(e) => {
                // Send error to frontend
                let packet = sender::Packet::new(
                    sender::Event::Error,
                    format!("{}", e),
                    sender::SendStrategy::General,
                );
                packet.send(&app);
            }
        };


    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let dir = app.path().app_data_dir().map_err(|_| "Failed to get app data dir")?;
            println!("Dir: {:?}", dir);
            app.manage(AppMutex(Mutex::new(AppState::new(dir))));
            let state = app.state::<AppMutex>();
            let mut state = state.0.lock().unwrap();
            state.check_settings();
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            disassemble_file,
            hexdump_file,
            readelf_file,
            read_spec
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
