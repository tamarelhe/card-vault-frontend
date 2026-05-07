export { createApiClient, ApiError, UnauthorizedError, NotFoundError } from './client';
export type { ApiClient } from './client';

export { createAuthApi } from './auth';
export type { LoginRequest, RegisterRequest, RefreshRequest, LogoutRequest } from './auth';

export { createProfileApi } from './profile';
export type { ChangePasswordBody, ChangeAvatarPresetBody, AvatarURLResponse, PresetListResponse } from './profile';

export { createCardsApi } from './cards';
export type {
  CardSearchParams, CardSearchResponse, CardSearchMeta,
  PriceVariation, PriceVariationsResponse,
  TopMoverItem, TopMoverCollection, TopMoverWishlist, TopMoversResponse, TopMoversParams,
} from './cards';

export { createCollectionsApi } from './collections';
export type {
  AddCollectionCardBody,
  CreateCollectionBody,
  UpdateCollectionBody,
  UpdateCollectionCardBody,
  ListCollectionCardsParams,
} from './collections';

export { createScanApi } from './scan';

export { createImportsApi } from './imports';
export type { SubmitImportBody } from './imports';

export { createWishlistsApi } from './wishlists';
export type {
  CreateWishlistBody,
  UpdateWishlistBody,
  AddWishlistItemBody,
  UpdateWishlistItemBody,
} from './wishlists';

export { queryKeys } from './query-keys';
