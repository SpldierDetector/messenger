import { useEffect, useState } from 'react';
import {
  Image,
  Text,
  View,
} from 'react-native';
import { API_BASE_URL } from '@/config/api';
import { styles } from '@/styles/user-avatar.styles';

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

export function UserAvatar({
  name,
  avatarUrl,
  size = 44,
}: UserAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [avatarUrl]);

  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const imageUri = avatarUrl
    ? `${API_BASE_URL}${avatarUrl}`
    : null;

  const showImage = Boolean(imageUri) && !hasImageError;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {showImage && imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            setHasImageError(true);
          }}
        />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.letter,
            {
              fontSize: Math.round(size * 0.43),
            },
          ]}
        >
          {letter}
        </Text>
      )}
    </View>
  )
}