import { ActivityForm } from '@/components/ActivityForm'
import { AutomaticFeed } from '@/components/AutomaticFeed'

export default function SharePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Share what you have done for Supabase
        </h1>
        <p className="mt-1 text-[var(--foreground-lighter)]">
          Report your community contributions and earn points
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual submission form */}
        <div>
          <ActivityForm />
        </div>

        {/* Automatic contributions feed */}
        <div>
          <AutomaticFeed />
        </div>
      </div>
    </div>
  )
}
