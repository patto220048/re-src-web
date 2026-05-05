/**
 * RE-SRC Premiere ExtendScript - Advanced Import Logic
 */

function getOrCreateBin(binName) {
    var project = app.project;
    var root = project.rootItem;
    var targetBin = null;

    for (var i = 0; i < root.children.numItems; i++) {
        var item = root.children[i];
        if (item.type === 2 && item.name === binName) { // 2 = ProjectItemType.BIN
            targetBin = item;
            break;
        }
    }

    if (!targetBin) {
        targetBin = root.createBin(binName);
    }
    return targetBin;
}

function getSmartTrack(sequence, time, importedItem, isAudio) {
    var tracks = isAudio ? sequence.audioTracks : sequence.videoTracks;
    var start = time.seconds;
    
    // Tính toán thời lượng của clip để tránh đè lên các clip phía sau
    var duration = 5; // Mặc định 5s nếu không lấy được
    try {
        if (importedItem) {
            duration = importedItem.getOutPoint().seconds - importedItem.getInPoint().seconds;
            if (duration <= 0) duration = 5; 
        }
    } catch(e) {}
    var end = start + duration;
    
    for (var i = 0; i < tracks.numItems; i++) {
        var track = tracks[i];
        if (track.locked) continue; 

        var hasCollision = false;
        for (var j = 0; j < track.clips.numItems; j++) {
            var clip = track.clips[j];
            var clipStart = clip.start.seconds;
            var clipEnd = clip.end.seconds;
            
            // Kiểm tra va chạm giữa hai khoảng thời gian:
            // [start, end] giao với [clipStart, clipEnd]
            if (start < clipEnd && end > clipStart) {
                hasCollision = true;
                break;
            }
        }
        
        if (!hasCollision) return track;
    }
    
    // Nếu tất cả track đều bận, ưu tiên dùng track cao nhất để ít ảnh hưởng nhất
    return tracks[tracks.numItems - 1] || tracks[0];
}

function importToTimeline(filePath, displayName, fileFormat) {
    var project = app.project;
    if (!project) return "No project open";

    var activeSequence = project.activeSequence;
    if (!activeSequence) return "No active sequence";

    // 1. Manage Folder (Bin)
    var targetBin = getOrCreateBin("SFXFolder Assets");
    var importedItem = null;

    // 2. Kiểm tra xem item đã tồn tại trong Project chưa (Tái sử dụng nếu đã import)
    if (displayName) {
        for (var i = 0; i < targetBin.children.numItems; i++) {
            var item = targetBin.children[i];
            if (item.name === displayName) {
                importedItem = item;
                break;
            }
        }
    }

    // 3. Nếu chưa có item trong Project, tiến hành Import file mới
    if (!importedItem) {
        var fileToImport = [filePath];
        var success = project.importFiles(fileToImport, true, targetBin, false);

        if (!success) return "Import failed";

        // Tìm item vừa import để đổi tên
        var diskFileName = filePath.split('/').pop(); 
        for (var j = 0; j < targetBin.children.numItems; j++) {
            var item = targetBin.children[j];
            if (item.name === diskFileName) {
                importedItem = item;
                break;
            }
        }

        if (importedItem && displayName) {
            importedItem.name = displayName;
        }
    }

    if (!importedItem) return "Error: Could not find or import item";

    // 4. Smart Placement
    var isAudioOnly = false;
    if (fileFormat) {
        var fmt = fileFormat.toLowerCase();
        // Danh sách các định dạng âm thanh phổ biến
        var audioExts = ['wav', 'mp3', 'm4a', 'aac', 'flac', 'aif', 'aiff'];
        for (var k = 0; k < audioExts.length; k++) {
            if (fmt === audioExts[k]) {
                isAudioOnly = true;
                break;
            }
        }
    }

    var time = activeSequence.getPlayerPosition();
    // Truyền thêm importedItem để tính toán collision chính xác
    var targetTrack = getSmartTrack(activeSequence, time, importedItem, isAudioOnly);
    
    if (targetTrack) {
        targetTrack.overwriteClip(importedItem, time);
        return "Successfully added to " + (isAudioOnly ? "Audio" : "Video") + " Track: " + (displayName || diskFileName);
    }

    return "Error: No suitable track found";
}
