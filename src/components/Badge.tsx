interface Props {
  count: number
  variant?: 'danger' | 'warning' | 'neutral'
}

export function Badge({ count, variant = 'danger' }: Props) {
  if (count === 0) return null
  const colors = variant === 'danger' ? 'bg-red-500' : variant === 'neutral' ? 'bg-gray-400' : 'bg-yellow-500'
  return (
    <span className={`${colors} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}
