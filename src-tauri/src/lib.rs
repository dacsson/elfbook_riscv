mod sender;
mod spec_parser;
mod state;

use std::sync::Mutex;
use std::error::Error;
use tauri_plugin_dialog::{DialogExt, FilePath};
use tauri::{AppHandle, Emitter, Manager, State, Window};
use std::process::Command;
use std::io::Write;
use crate::state::{AppMutex, AppState};

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
            sender::SendStrategy::ByChunks
        );
        packet.send(&app);
    } else {
        let epacket = sender::Packet::new(
            sender::Event::Error,
            objdump.unwrap_err(),
            sender::SendStrategy::General
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
            sender::SendStrategy::ByChunks
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
            sender::SendStrategy::ByChunks
        );
        packet.send(&app);
    }
}

#[tauri::command]
fn read_spec(app: AppHandle, query: String) {
    tauri::async_runtime::spawn(async move {
        let text = spec_parser::find_in_doc("/home/safonoff/Documents/riscv_spec.txt", &query);

        let packet = sender::Packet::new(
            sender::Event::SpecResult,
            String::from(text.unwrap().join("\n")),
            sender::SendStrategy::ByChunks
        );
        packet.send(&app);
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.manage(AppMutex(Mutex::new(AppState::new())));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            disassemble_file,
            hexdump_file,
            readelf_file,
            read_spec
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
