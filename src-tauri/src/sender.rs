//! Communication with JS frontend
//! utilities

use tauri::{AppHandle, Emitter};
use tauri::ipc::Channel;

/// Event kinds that frontend
/// can accept
pub enum Event {
    Disassembled, // result of llvm-objdump
    HexDumped, // result of xxd
    ElfInfoDumped, // result of readelf
    Error
}

impl Event {
    pub fn value(&self) -> String {
        match self {
            Event::Disassembled => "disassembled".to_string(),
            Event::HexDumped => "hexdumped".to_string(),
            Event::ElfInfoDumped => "elfinfodumped".to_string(),
            Event::Error => "backend_error".to_string(),
        }
    }
}

pub enum SendStrategy {
    General, // just send data as a whole
    ByChunks
}

pub struct Packet<T> {
    event: Event,
    data: T,
    strategy: SendStrategy,
}

impl<T> Packet<T> {
    pub fn new(event: Event, data: T, strategy: SendStrategy) -> Packet<T> {
        Self {
            event,
            data,
            strategy,
        }
    }
}

impl Packet<String> {
    /// Send string data to frontend
    ///
    /// Emits an [AppHandle] event
    pub fn send(&self, channel: Channel<String>) {
        match &self.strategy {
            SendStrategy::General => {
                let _ = channel.send(self.data.to_string());
            }
            SendStrategy::ByChunks => {
                println!("{} {}", self.event.value(), self.data.lines().count());
                let chunk_size = 500; // Tunable
                let lines: Vec<&str> = self.data.lines().collect();
                for chunk in lines.chunks(chunk_size) {
                    let chunk_str = chunk.join("\n");
                    let _ = channel.send(chunk_str);
                }
                println!("sender end");
            }
        }
    }
}
