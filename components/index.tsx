import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function Card({ children, className = "", style }: CardProps) {
  return (
    <View className={`bg-surface rounded-2xl p-4 ${className}`} style={style}>
      {children}
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  textClassName = "",
}: ButtonProps) {
  const baseClasses = "rounded-xl items-center justify-center font-semibold";
  
  const variantClasses: Record<string, string> = {
    primary: "bg-accent",
    secondary: "bg-muted",
    outline: "border-2 border-accent bg-transparent",
    ghost: "bg-transparent",
  };
  
  const sizeClasses: Record<string, string> = {
    sm: "py-2 px-3",
    md: "py-3 px-5",
    lg: "py-4 px-7",
  };
  
  const textColorClasses: Record<string, string> = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-accent",
    ghost: "text-accent",
  };
  
  const disabledClasses = disabled ? "opacity-50" : "";
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#DC5F00"} />
      ) : (
        <Text className={`${textColorClasses[variant]} text-base ${textClassName}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  className?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  className = "",
}: InputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-text-primary text-sm font-medium mb-2">{label}</Text>
      )}
      <View className={`bg-surface border rounded-xl px-4 py-3 ${error ? "border-red-500" : "border-gray-200"}`}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#686D76"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="text-text-primary text-base"
        />
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({
  progress,
  color = "#DC5F00",
  backgroundColor = "#E5E5E5",
  height = 8,
  className = "",
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  return (
    <View className={`rounded-full overflow-hidden ${className}`} style={{ backgroundColor, height }}>
      <View
        className="rounded-full"
        style={{
          backgroundColor: color,
          width: `${clampedProgress * 100}%`,
          height: "100%",
        }}
      />
    </View>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({ title, value, icon, subtitle, trend, trendValue }: StatCardProps) {
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-muted",
  };
  
  return (
    <Card className="flex-1 min-w-[120px]">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-xs">{title}</Text>
        {icon}
      </View>
      <Text className="text-text-primary text-2xl font-bold">{value}</Text>
      {(trend || trendValue) && (
        <View className="flex-row items-center mt-1">
          {trend && (
            <Text className={`text-xs ${trendColors[trend]}`}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </Text>
          )}
          {trendValue && (
            <Text className={`text-xs ml-1 ${trend ? trendColors[trend] : "text-muted"}`}>
              {trendValue}
            </Text>
          )}
        </View>
      )}
      {subtitle && <Text className="text-muted text-xs mt-1">{subtitle}</Text>}
    </Card>
  );
}

interface IconButtonProps {
  icon: ReactNode;
  onPress: () => void;
  variant?: "filled" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconButton({ icon, onPress, variant = "filled", size = "md", className = "" }: IconButtonProps) {
  const sizeClasses: Record<string, string> = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  
  const variantClasses: Record<string, string> = {
    filled: "bg-accent",
    outline: "border-2 border-accent bg-transparent",
    ghost: "bg-transparent",
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-full items-center justify-center ${sizeClasses[size as string]} ${variantClasses[variant as string]} ${className}`}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
}



interface BadgeProps {
  text: string;
  variant?: "default" | "success" | "warning" | "error" | "accent";
  className?: string;
}

export function Badge({ text, variant = "default", className = "" }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    default: "bg-gray-200 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    accent: "bg-accent/20 text-accent",
  };
  
  return (
    <View className={`px-2 py-1 rounded-full ${variantClasses[variant]} ${className}`}>
      <Text className="text-xs font-medium">{text}</Text>
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = "" }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-12 px-6 ${className}`}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-text-primary text-lg font-semibold text-center">{title}</Text>
      {description && (
        <Text className="text-muted text-sm text-center mt-2">{description}</Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ uri, name, size = "md", className = "" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-xl",
  };
  
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
  
  if (uri) {
    return (
      <View className={`rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
        <Image source={{ uri }} className="w-full h-full" />
      </View>
    );
  }
  
  return (
    <View className={`rounded-full bg-accent/20 items-center justify-center ${sizeClasses[size]} ${className}`}>
      <Text className={`text-accent font-bold ${textSizeClasses[size]}`}>{initials}</Text>
    </View>
  );
}

interface DividerProps {
  className?: string;
}

export function Divider({ className = "" }: DividerProps) {
  return <View className={`h-px bg-gray-200 ${className}`} />;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  onPress?: () => void;
  className?: string;
}

export function ListItem({ title, subtitle, leftIcon, rightElement, onPress, className = "" }: ListItemProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  
  return (
    <Wrapper
      onPress={onPress}
      className={`flex-row items-center py-3 px-4 ${className}`}
      activeOpacity={0.7}
    >
      {leftIcon && <View className="mr-3">{leftIcon}</View>}
      <View className="flex-1">
        <Text className="text-text-primary font-medium">{title}</Text>
        {subtitle && <Text className="text-muted text-sm mt-0.5">{subtitle}</Text>}
      </View>
      {rightElement}
    </Wrapper>
  );
}
