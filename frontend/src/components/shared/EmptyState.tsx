interface Props { icon: string; title: string; description?: string }

export default function EmptyState({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="font-semibold text-gray-300">{title}</p>
      {description && <p className="text-sm text-gray-500 mt-2 max-w-xs">{description}</p>}
    </div>
  )
}
