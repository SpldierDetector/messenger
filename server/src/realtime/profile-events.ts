import type {
  UserData,
} from '../types/user.js';

export type UserProfileUpdatedEvent = {
  type: 'user_profile_updated';
  user: UserData;
};

type ProfileListener = (
  event: UserProfileUpdatedEvent,
) => void;

const listeners = new Set<ProfileListener>();

export function subscribeToProfileUpdates(
  listener: ProfileListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function publishProfileUpdate(
  user: UserData,
): void {
  const event: UserProfileUpdatedEvent ={
    type: 'user_profile_updated',
    user,
  };

  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error(
        'Failed to deliver profile update:',
        error,
      );
    }
  }
}