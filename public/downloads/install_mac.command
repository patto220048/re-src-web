#!/bin/bash

# SFXFolder Premiere Plugin ONLINE Installer for macOS
# Author: SFXFolder Team

echo "------------------------------------------------"
echo "SFXFolder Premiere Plugin Installer (macOS)"
echo "------------------------------------------------"

# 1. Cấu hình đường dẫn
DOWNLOAD_URL="https://sfxfolder.com/downloads/plugin_core.zip"
DEST_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/com.resrc.premiere"
TEMP_ZIP="/tmp/sfxfolder_plugin.zip"

# 2. Kiểm tra kết nối Internet
echo "Checking internet connection..."
if ! ping -c 1 google.com > /dev/null 2>&1; then
    echo "ERROR: No internet connection. Please check your network."
    exit 1
fi

# 3. Tải plugin từ server
echo "Downloading latest plugin version..."
curl -L "$DOWNLOAD_URL" -o "$TEMP_ZIP"

if [ ! -f "$TEMP_ZIP" ]; then
    echo "ERROR: Download failed. Please try again later."
    exit 1
fi

# 4. Dọn dẹp bản cũ
if [ -d "$DEST_DIR" ]; then
    echo "Cleaning up old version..."
    rm -rf "$DEST_DIR"
fi

# 5. Giải nén và cài đặt
echo "Installing to: $DEST_DIR"
mkdir -p "$DEST_DIR"
unzip -q "$TEMP_ZIP" -d "$DEST_DIR"

# 6. Cấp quyền
chmod -R 755 "$DEST_DIR"

# 7. Kích hoạt Debug Mode
echo "Configuring Adobe Security Settings..."
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1

# 8. Dọn dẹp file tạm
rm -f "$TEMP_ZIP"

echo "------------------------------------------------"
echo "INSTALLATION COMPLETE!"
echo "------------------------------------------------"
echo "1. Please RESTART Premiere Pro."
echo "2. Go to: Window -> Extensions -> SFXFolder"
echo "------------------------------------------------"

# Keep terminal open
read -p "Press Enter to exit..."
