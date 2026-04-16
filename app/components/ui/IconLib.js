import {
  Film, Video, ImageIcon, Camera, Monitor, Tv, Aperture, Clapperboard,
  Music, Volume2, Mic, Headphones, Waves,
  Type, SlidersHorizontal, Zap, Sparkles, Layers, Code, Box, Cpu, Maximize, Palette,
  Folder, Archive, Bookmark, Tag, Globe, HardDrive, Search,
  Package
} from "lucide-react";

export const ICON_MAP = {
  film: Film,
  video: Video,
  image: ImageIcon,
  camera: Camera,
  monitor: Monitor,
  tv: Tv,
  aperture: Aperture,
  clapperboard: Clapperboard,
  music: Music,
  "volume-2": Volume2,
  mic: Mic,
  headphones: Headphones,
  waves: Waves,
  type: Type,
  sliders: SlidersHorizontal,
  zap: Zap,
  sparkles: Sparkles,
  layers: Layers,
  code: Code,
  box: Box,
  cpu: Cpu,
  maximize: Maximize,
  palette: Palette,
  folder: Folder,
  archive: Archive,
  bookmark: Bookmark,
  tag: Tag,
  globe: Globe,
  harddrive: HardDrive,
  search: Search,
};

export const ICON_LIST = Object.keys(ICON_MAP).map(key => ({
  id: key,
  Icon: ICON_MAP[key]
}));

export function getIcon(id) {
  return ICON_MAP[id] || Package;
}
