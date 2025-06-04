// src/components/ui/NotificationItem.tsx

interface NotificationItemProps {
  message: string
}

export function NotificationItem({ message }: NotificationItemProps) {
  return (
    <div className="text-sm text-gray-700 border-b py-2 last:border-b-0"> {/* last:border-b-0 para no poner borde en el último item */}
      {message}
    </div>
  )
}