interface Props {
  count: number
  variant?: 'danger' | 'warning'
}

export function Badge({ count, variant = 'danger' }: Props) {
  if (count === 0) return null
  const colors = variant === 'danger' ? 'bg-red-500' : 'bg-yellow-500'
  return (
    <span className={`${colors} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
      {count > 9 ? '9+' : count}
    </span>
  )
}
