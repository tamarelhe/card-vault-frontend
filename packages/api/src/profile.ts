import type { ApiClient } from './client';
import type { UserProfile } from '@cardvault/core';

export interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

export interface ChangeAvatarPresetBody {
  preset_id: string;
}

export interface AvatarURLResponse {
  avatar_url: string;
}

export interface PresetListResponse {
  avatars: string[];
}

export function createProfileApi(client: ApiClient) {
  return {
    getProfile(): Promise<UserProfile> {
      return client.get<UserProfile>('/profile');
    },
    changePassword(body: ChangePasswordBody): Promise<void> {
      return client.patch<void>('/profile/password', body, { skipGlobalUnauthorized: true });
    },
    changeAvatarPreset(body: ChangeAvatarPresetBody): Promise<AvatarURLResponse> {
      return client.patch<AvatarURLResponse>('/profile/avatar', body);
    },
    uploadAvatar(file: File): Promise<AvatarURLResponse> {
      const form = new FormData();
      form.append('avatar', file);
      return client.patchForm<AvatarURLResponse>('/profile/avatar', form);
    },
    listPresetAvatars(): Promise<PresetListResponse> {
      return client.get<PresetListResponse>('/profile/avatars');
    },
  };
}
