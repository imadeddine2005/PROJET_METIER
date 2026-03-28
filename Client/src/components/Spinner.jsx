function Spinner() {
  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 sm:h-16 sm:w-16" />
    </div>
  )
}

export default Spinner
