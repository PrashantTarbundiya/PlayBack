import { Loader2 } from "lucide-react"

const LoadingButton = ({
  loading = false,
  disabled = false,
  children,
  className = "",
  type = "button",
  ...props
}) => {
  const isDisabled = loading || disabled

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`relative inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 ${className}`}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2
          size={14}
          className="animate-spin"
        />
      )}
      <span>{children}</span>
    </button>
  )
}

export default LoadingButton
