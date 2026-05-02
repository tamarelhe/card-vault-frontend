export { createApiClient, ApiError, UnauthorizedError, NotFoundError } from './client';
export type { ApiClient } from './client';

export { createAuthApi } from './auth';
export type { LoginRequest, RegisterRequest, RefreshRequest, LogoutRequest } from './auth';

export { createCardsApi } from './cards';
export type { CardSearchParams, CardSearchResponse, CardSearchMeta, PriceVariation, PriceVariationsResponse } from './cards';

export { createCollectionsApi } from './collections';
export type {
  CreateCollectionBody,
  UpdateCollectionBody,
  UpdateCollectionCardBody,
  ListCollectionCardsParams,
} from './collections';

export { createScanApi } from './scan';

export { queryKeys } from './query-keys';
