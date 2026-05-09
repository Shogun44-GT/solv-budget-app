export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500"
      style={{ width: size, height: size }}
    />
  )
}
