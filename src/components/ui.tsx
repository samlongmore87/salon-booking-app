import {
    ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps,
} from "react-native";
import { colors, fonts } from "../constants/theme";

type FieldProps = TextInputProps & { label: string; prefix?: string };

export function TextField({ label, prefix, style, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {prefix ? (
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={colors.grey600}
          style={[styles.input, style]}
          {...props}
        />
      </View>
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, loading, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [styles.button, (pressed || loading || disabled) && styles.dim]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
export function SecondaryButton({ title, onPress, disabled }: Omit<ButtonProps, "loading">) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.secondary, (pressed || disabled) && styles.dim]}
    >
      <Text style={styles.secondaryText}>{title}</Text>
    </Pressable>
  );
}
export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.black} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  row: { flexDirection: "row", gap: 8 },
  prefix: {
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.grey100,
    justifyContent: "center",
  },
  prefixText: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.grey100,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.black,
  },
  button: {
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  dim: { opacity: 0.7 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.white },
    secondary: {
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.grey100,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 17, color: colors.black },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});