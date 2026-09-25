import { View, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '../../theme';

/*
  Card — contenitore base. Se passi onPress diventa toccabile (con feedback).
*/
export default function Card({ children, style, onPress, ...props }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]} {...props}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.xl,
    ...shadow,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
