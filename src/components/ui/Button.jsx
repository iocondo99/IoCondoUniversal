import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, radius, font, touch, shadow } from '../../theme';

/*
  Button — varianti primary / ghost / soft (come nel web).
  Touch target >= 48px per accessibilità.
*/
export default function Button({ variant = 'primary', children, onPress, disabled, loading, style, textStyle }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        v.container,
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading && <ActivityIndicator size="small" color={v.label.color} style={{ marginRight: 8 }} />}
        {typeof children === 'string'
          ? <Text style={[styles.label, v.label, textStyle]}>{children}</Text>
          : children}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: font.bold, fontSize: font.body },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
});

const VARIANTS = {
  primary: {
    container: { backgroundColor: colors.primary, ...shadow },
    label: { color: colors.primaryInk },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderColor: colors.line },
    label: { color: colors.ink },
  },
  soft: {
    container: { backgroundColor: colors.bgSoft, borderColor: colors.line },
    label: { color: colors.ink },
  },
};
