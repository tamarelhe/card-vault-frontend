import type { Game } from './card';

export interface ParsedScanHints {
  game: Game;
  name?: string;
  setCode?: string;
  number?: string;
  confidence: number;
  rawText: string;
}

export type ScanState =
  | 'idle'
  | 'requesting_permission'
  | 'camera_ready'
  | 'scanning'
  | 'processing_frame'
  | 'resolving'
  | 'exact_match'
  | 'multiple_candidates'
  | 'not_found'
  | 'error';

export type ScanResultStatus = 'exact' | 'multiple_candidates' | 'not_found';

export interface ScanResolveRequest {
  game: Game;
  name?: string;
  setCode?: string;
  number?: string;
  rawText: string;
}

export interface ScanResolveResponse {
  status: ScanResultStatus;
  card?: ScanResolvedCard;
  candidates?: ScanResolvedCard[];
}

export interface ScanResolvedCard {
  id: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
}
