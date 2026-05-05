/**
 * RE-SRC Premiere ExtendScript - Bulletproof Timeline Placement
 */

function getOrCreateBin(binName) {
    try {
        var root = app.project.rootItem;
        for (var i = 0; i < root.children.numItems; i++) {
            var item = root.children[i];
            if (item && item.type === 2 && item.name === binName) return item;
        }
        return root.createBin(binName);
    } catch(e) {
        return app.project.rootItem;
    }
}

function getSafeSeconds(timeObj) {
    if (!timeObj) return 0;
    try {
        if (timeObj.seconds !== undefined) return timeObj.seconds;
        if (timeObj.ticks !== undefined) return Number(timeObj.ticks) / 254016000000;
    } catch(e) {}
    return 0;
}

function getSmartTrack(sequence, time, importedItem, isAudio) {
    var tracks = isAudio ? sequence.audioTracks : sequence.videoTracks;
    if (!tracks || tracks.numItems === 0) {
        // Nếu không có loại track yêu cầu, thử chuyển sang loại kia
        tracks = isAudio ? sequence.videoTracks : sequence.audioTracks;
    }
    if (!tracks || tracks.numItems === 0) return null;

    var playhead = getSafeSeconds(time);
    var duration = 2.0; 
    try {
        if (importedItem) {
            duration = getSafeSeconds(importedItem.getOutPoint()) - getSafeSeconds(importedItem.getInPoint());
        }
    } catch(e) {}
    if (duration <= 0) duration = 2.0;
    var endPos = playhead + duration;

    // Duyệt tìm track trống
    for (var i = 0; i < tracks.numItems; i++) {
        var track = null;
        try { track = tracks.item(i); } catch(e) { track = tracks[i]; }
        if (!track || track.locked) continue;

        var isOccupied = false;
        try {
            var clips = track.clips;
            if (clips && clips.numItems > 0) {
                for (var j = 0; j < clips.numItems; j++) {
                    var clip = null;
                    try { clip = clips.item(j); } catch(e) { clip = clips[j]; }
                    if (clip) {
                        var cStart = getSafeSeconds(clip.start);
                        var cEnd = getSafeSeconds(clip.end);
                        if (playhead < (cEnd - 0.05) && endPos > (cStart + 0.05)) {
                            isOccupied = true;
                            break;
                        }
                    }
                }
            }
        } catch(e) { isOccupied = false; }

        if (!isOccupied) return track;
    }

    // Nếu không có track nào trống, trả về track đầu tiên (Fallback an toàn nhất)
    try { return tracks.item(0); } catch(e) { return tracks[0]; }
}

function importToTimeline(filePath, displayName, fileFormat) {
    try {
        var project = app.project;
        if (!project) return "Error: No project open";
        var sequence = project.activeSequence;
        if (!sequence) return "Error: No active sequence found";

        var targetBin = getOrCreateBin("SFXFolder Assets");
        var importedItem = null;

        // 1. Tái sử dụng Asset
        if (displayName) {
            var children = targetBin.children;
            for (var i = 0; i < children.numItems; i++) {
                var item = children[i];
                if (item && item.name === displayName) {
                    importedItem = item;
                    break;
                }
            }
        }

        // 2. Import mới nếu cần
        if (!importedItem) {
            var success = project.importFiles([filePath], true, targetBin, false);
            if (!success) return "Error: Import failed";

            var diskFileName = filePath.split('/').pop();
            var childrenAfter = targetBin.children;
            for (var j = 0; j < childrenAfter.numItems; j++) {
                var itemAfter = childrenAfter[j];
                if (itemAfter && itemAfter.name === diskFileName) {
                    importedItem = itemAfter;
                    if (displayName) importedItem.name = displayName;
                    break;
                }
            }
        }

        if (!importedItem) return "Error: Asset not found after import";

        // 3. Phân loại Track
        var isAudio = true;
        if (fileFormat) {
            var fmt = fileFormat.toLowerCase();
            var videoExts = ['mp4', 'mov', 'avi', 'mkv', 'mxf', 'webm'];
            for (var v = 0; v < videoExts.length; v++) {
                if (fmt === videoExts[v]) { isAudio = false; break; }
            }
        }

        // 4. Chèn vào Timeline
        var time = sequence.getPlayerPosition();
        var targetTrack = getSmartTrack(sequence, time, importedItem, isAudio);

        if (targetTrack) {
            targetTrack.overwriteClip(importedItem, time);
            var trackName = "Timeline";
            try { trackName = targetTrack.name; } catch(e) {}
            return "OK: Added to " + trackName;
        }

        return "Error: Final track selection failed";
    } catch(err) {
        return "Critical Error: " + err.toString();
    }
}
