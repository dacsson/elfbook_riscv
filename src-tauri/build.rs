fn main() {
    #[cfg(target_os = "linux")]
    {
        // multiple environment variable combinations for chromium webview
        std::env::set_var("WRY_WEBVIEW_BACKEND", "chromium");
        std::env::set_var("TAURI_WEBVIEW_BACKEND", "chromium");
        std::env::set_var("WEBVIEW_BACKEND", "chromium");

        // try to disable compositing and use hardware acceleration
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "0");
        std::env::set_var("WEBKIT_FORCE_HARDWARE_ACCELERATION", "1");

        // flags that might help with chromium detection
        std::env::set_var("CHROME_DEVEL_SANDBOX", "/usr/lib/chromium-browser/chrome-sandbox");
        std::env::set_var("CHROME_WRAPPER", "/usr/bin/chromium-browser");
    }
    tauri_build::build()
}
