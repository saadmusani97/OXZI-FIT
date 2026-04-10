import { TouchableOpacity, Text } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  className?: string
}

export default function Button({ title, onPress, variant = 'primary', disabled, className }: ButtonProps) {
  const base = 'rounded-xl py-4 px-6'
  const variants = {
    primary: `${base} bg-orange-500`,
    secondary: `${base} bg-zinc-800`,
    ghost: 'py-4 px-6 bg-transparent',
  }
  const textVariants = {
    primary: 'text-white font-semibold text-center',
    secondary: 'text-white font-semibold text-center',
    ghost: 'text-orange-500 font-semibold text-center',
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
      activeOpacity={0.8}
    >
      <Text className={textVariants[variant]}>{title}</Text>
    </TouchableOpacity>
  )
}
