import { ActivityFeed } from '@/components/ActivityFeed'

export default function FeedPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Activity feed
        </h1>
        <p className="mt-1 text-[var(--foreground-lighter)]">
          See what the community has been up to
        </p>
      </div>

      <ActivityFeed />
    </div>
  )
}
