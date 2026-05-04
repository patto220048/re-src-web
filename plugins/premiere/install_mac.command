#!/bin/bash

# SFXFolder Premiere Plugin Installer for macOS
# Author: RE-SRC Team

echo "------------------------------------------------"
echo "SFXFolder Premiere Plugin Installer"
echo "------------------------------------------------"

# 1. Define Paths
DEST_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/com.resrc.premiere"
SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Installing to: $DEST_DIR"

# 2. Create directory
mkdir -p "$DEST_DIR"

# 3. Copy files (excluding installer files)
echo "Copying files..."
cp -R "$SRC_DIR/"* "$DEST_DIR/"
rm -f "$DEST_DIR/installer_win.iss"
rm -f "$DEST_DIR/install_mac.command"

# 4. Enable Debug Mode for Adobe CEP
echo "Configuring Adobe Security Settings..."
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
defaults write com.adobe.CSXS.13 PlayerDebugMode 1

echo "------------------------------------------------"
echo "INSTALLATION COMPLETE!"
echo "Please restart Premiere Pro."
echo "Go to Window -> Extensions -> SFXFolder"
echo "------------------------------------------------"

# Keep window open
read -p "Press enter to exit"
