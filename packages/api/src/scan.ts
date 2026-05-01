import type { ApiClient } from './client';
import type { ScanResolveRequest, ScanResolveResponse } from '@cardvault/core';

export function createScanApi(client: ApiClient) {
  return {
    resolve(body: ScanResolveRequest): Promise<ScanResolveResponse> {
      return client.post<ScanResolveResponse>('/scan/resolve', body);
    },
  };
}
