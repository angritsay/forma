// Manifest schema v1 — see docs/spec.md §4.1. The manifest is produced by the
// iOS app and replaced wholesale on every sync; the server never edits it.

export type MediaKind = 'photo' | 'video';
export type GroupStatus = 'open' | 'closed';

export interface AssetFlags {
  delete: boolean;
  hidden: boolean;
  claudePick: boolean;
}

export interface ManifestAsset {
  /** PhotoKit localIdentifier sanitized for filesystem/URL use ("/" → "_").
   *  Names the media folder on the server and the exported original's stem. */
  id: string;
  cloudId?: string | null;
  type: MediaKind;
  creationDate: string;
  duration: number;
  width: number;
  height: number;
  favorite: boolean;
  flags: AssetFlags;
  files: string[];
}

export interface ManifestGroup {
  id: string;
  status: GroupStatus;
  name?: string | null;
  tags: string[];
  startedAt: string;
  endedAt: string;
  location?: { lat: number; lon: number; place?: string | null } | null;
  assets: ManifestAsset[];
}

export interface Manifest {
  version: 1;
  generatedAt: string;
  device: string;
  settings?: { gapMinutes?: number; distanceKm?: number };
  groups: ManifestGroup[];
}
