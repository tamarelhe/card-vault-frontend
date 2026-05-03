import type { ApiClient } from './client';
import type { ImportJob } from '@cardvault/core';

export interface SubmitImportBody {
  file: File;
  platform: 'manabox' | 'moxfield' | 'archidekt';
  collection_id?: string;
  collection_name?: string;
}

export function createImportsApi(client: ApiClient) {
  return {
    submit(body: SubmitImportBody): Promise<ImportJob> {
      const form = new FormData();
      form.append('file', body.file);
      form.append('platform', body.platform);
      if (body.collection_id) form.append('collection_id', body.collection_id);
      if (body.collection_name) form.append('collection_name', body.collection_name);
      return client.postForm<ImportJob>('/imports', form);
    },
    getStatus(id: string): Promise<ImportJob> {
      return client.get<ImportJob>(`/imports/${id}`);
    },
  };
}
