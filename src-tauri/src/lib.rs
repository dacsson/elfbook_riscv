mod sender;

use tauri_plugin_dialog::DialogExt;
use tauri::{AppHandle, Emitter, Manager, State, Window};
use std::process::Command;
use std::io::Write;
use tauri_plugin_dialog::FileDialogBuilder;
use serde_json::{json, Value};
use tauri::ipc::Channel;

#[tauri::command]
fn disassemble_file(app: AppHandle, file_path: &str, on_event: Channel<String>) {
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
        packet.send(on_event);
    } else {
        let epacket = sender::Packet::new(
            sender::Event::Error,
            objdump.unwrap_err(),
            sender::SendStrategy::General
        );
        epacket.send(on_event);
    }
}

#[tauri::command]
fn hexdump_file(app: AppHandle, file_path: &str, on_event: Channel<String>) {
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
        packet.send(on_event);
    }
}

#[tauri::command]
fn readelf_file(app: AppHandle, file_path: &str, on_event: Channel<String>) {
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
        packet.send(on_event);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            disassemble_file,
            hexdump_file,
            readelf_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
