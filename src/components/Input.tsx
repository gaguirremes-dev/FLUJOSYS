import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
}

export function Input({ label, error, prefix, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-400 text-sm select-none">{prefix}</span>
        )}
        <input
          className={`w-full border rounded-lg text-sm py-2 pr-3 ${prefix ? 'pl-7' : 'pl-3'} outline-none transition-colors
            border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
