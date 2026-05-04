; RE-SRC Premiere Plugin Installer for Windows
; Build with Inno Setup (https://jrsoftware.org/isdl.php)

[Setup]
AppName=SFXFolder Premiere Plugin
AppVersion=1.0.1
AppPublisher=SFXFolder
AppPublisherURL=https://sfxfolder.com
DefaultDirName={userappdata}\Adobe\CEP\extensions\com.resrc.premiere
DisableDirPage=yes
DefaultGroupName=SFXFolder
OutputDir=.\dist
OutputBaseFilename=SFXFolder_Premiere_Setup
SetupIconFile=..\..\public\favicon.ico
Compression=lzma
SolidCompression=yes
PrivilegesRequired=none
CloseApplications=yes

[Files]
Source: ".\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion; Excludes: "installer_win.iss,install_mac.command,dist\*"

[Registry]
; Enable Debug Mode for CSXS (Adobe CEP) to allow unsigned extensions
; CSXS 10 (Premiere 2020)
Root: HKCU; Subkey: "Software\Adobe\CSXS.10"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
; CSXS 11 (Premiere 2021/2022)
Root: HKCU; Subkey: "Software\Adobe\CSXS.11"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
; CSXS 12 (Premiere 2023)
Root: HKCU; Subkey: "Software\Adobe\CSXS.12"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
; CSXS 13 (Premiere 2024+)
Root: HKCU; Subkey: "Software\Adobe\CSXS.13"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue

[Icons]
Name: "{group}\Uninstall SFXFolder Plugin"; Filename: "{uninstallexe}"

[Messages]
FinishedHeadingLabel=Cài đặt hoàn tất!
FinishedLabel=Bộ công cụ SFXFolder đã được cài đặt vào Premiere Pro. Vui lòng khởi động lại Premiere Pro (nếu đang mở) và vào Window -> Extensions -> SFXFolder để bắt đầu sử dụng.
