import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ACTIVITY_TYPES } from '@/lib/constants/activityPoints'

export default function ProgramPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          SupaSquad Program
        </h1>
        <p className="mt-1 text-[var(--foreground-lighter)]">
          Everything you need to know about the Supabase community advocacy program
        </p>
      </div>

      {/* About section */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--foreground)]">About SupaSquad</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-[var(--foreground-light)]">
            <p>
              SupaSquad is the official Supabase community advocacy program. We recognize and reward
              community members who actively contribute to the Supabase ecosystem through content creation,
              community support, event organization, and open source contributions.
            </p>
            <p>
              As a SupaSquad member, you earn points for your contributions, climb the leaderboard,
              and unlock exclusive rewards and recognition from the Supabase team.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--foreground)]">How it works</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--foreground)] mb-1">1. Contribute</h3>
              <p className="text-sm text-[var(--foreground-lighter)]">
                Create content, answer questions, build projects, or organize events
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--foreground)] mb-1">2. Report</h3>
              <p className="text-sm text-[var(--foreground-lighter)]">
                Share your contributions manually or connect services for automatic tracking
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--foreground)] mb-1">3. Earn</h3>
              <p className="text-sm text-[var(--foreground-lighter)]">
                Accumulate points, climb the leaderboard, and unlock rewards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Point values */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--foreground)]">Point values</h2>
          <p className="text-sm text-[var(--foreground-lighter)]">
            Earn points for different types of contributions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACTIVITY_TYPES.map((activity) => (
              <div
                key={activity.type}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">{activity.label}</p>
                  <p className="text-xs text-[var(--foreground-lighter)]">{activity.description}</p>
                </div>
                <Badge variant="brand" className="ml-4 flex-shrink-0">
                  +{activity.points} pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-[var(--foreground)]">Rewards</h2>
          <p className="text-sm text-[var(--foreground-lighter)]">
            Unlock rewards as you accumulate points
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)]">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[var(--foreground)]">Community Badge</h3>
                  <Badge variant="default">100 pts</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-lighter)]">
                  Exclusive SupaSquad badge for your GitHub profile and social media
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)]">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[var(--foreground)]">Supabase Swag</h3>
                  <Badge variant="default">250 pts</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-lighter)]">
                  Official Supabase t-shirt, stickers, and other merchandise
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)]">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[var(--foreground)]">Launch Week Invite</h3>
                  <Badge variant="default">500 pts</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-lighter)]">
                  Exclusive invite to Supabase Launch Week events and early access to new features
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border)]">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-[var(--foreground)]">Ambassador Status</h3>
                  <Badge variant="default">1000 pts</Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--foreground-lighter)]">
                  Official Supabase Ambassador title with direct access to the team and special opportunities
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--foreground)]">Guidelines</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-[var(--foreground-light)]">
            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-2">Quality over quantity</h3>
              <p className="text-sm">
                Focus on creating meaningful contributions that help the community. A well-researched
                blog post or a detailed tutorial is worth more than multiple low-effort submissions.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-2">Be authentic</h3>
              <p className="text-sm">
                Share your genuine experiences with Supabase. The community values honest feedback
                and real-world use cases over promotional content.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-2">Support others</h3>
              <p className="text-sm">
                Help fellow community members by answering questions, providing feedback, and
                sharing knowledge. A rising tide lifts all boats.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-[var(--foreground)] mb-2">Stay updated</h3>
              <p className="text-sm">
                Follow Supabase announcements and new features to create timely, relevant content
                that helps others adopt the latest capabilities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
