'use client'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/AuthContext'

export function Hero() {
  const { signIn, isLoading } = useAuth()

  return (
    <div className="relative min-h-screen flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-[var(--surface)]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px),
                           linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12 lg:gap-24">
          {/* Left side - Text content */}
          <div className="flex-1 max-w-2xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-[var(--foreground)]">Build the Supabase</span>
              <br />
              <span className="text-[var(--brand)]">community.</span>
            </h1>

            <p className="mt-6 text-xl text-[var(--foreground-light)] leading-relaxed">
              Earn prizes and recognition by contributing to the Supabase ecosystem.
              Report your activities, climb the leaderboard, and connect with fellow advocates.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                size="large"
                onClick={signIn}
                isLoading={isLoading}
                className="gap-2"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 109 113"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                    fill="url(#paint0_linear)"
                  />
                  <path
                    d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                    fill="url(#paint1_linear)"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                    fill="#3ECF8E"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear"
                      x1="53.9738"
                      y1="54.974"
                      x2="94.1635"
                      y2="71.8295"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#249361"/>
                      <stop offset="1" stopColor="#3ECF8E"/>
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear"
                      x1="36.1558"
                      y1="30.578"
                      x2="54.4844"
                      y2="65.0806"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop/>
                      <stop offset="1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
                Login with Supabase
              </Button>
              <a
                href="https://supabase.com/community"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md border-2 border-white text-white bg-transparent hover:bg-white/10 transition-colors"
              >
                Apply to join the SupaSquad
              </a>
            </div>

            <p className="mt-4 text-sm text-[var(--foreground-lighter)]">
              Join the SupaSquad and start earning points today.
            </p>
          </div>

          <div className="flex-shrink-0">
            <div className="relative w-64 h-80 lg:w-80 lg:h-96">
              <svg
                viewBox="0 0 240 260"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path
                  d="M55 10 L185 10 L235 73 L120 250 L5 73 Z"
                  fill="url(#diamondGradient)"
                  stroke="var(--brand)"
                  strokeWidth="4"
                />
                <path
                  d="M63 22 L177 22 L220 73 L120 235 L20 73 Z"
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="1.5"
                  opacity="0.4"
                />
                <g transform="translate(70, 55) scale(0.9)">
                  <path
                    d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
                    fill="url(#diamondBolt1)"
                  />
                  <path
                    d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
                    fill="#3ECF8E"
                  />
                </g>
                <defs>
                  <linearGradient id="diamondGradient" x1="120" y1="10" x2="120" y2="250" gradientUnits="userSpaceOnUse">
                    <stop stopColor="hsl(0, 0%, 14%)" />
                    <stop offset="1" stopColor="hsl(0, 0%, 9%)" />
                  </linearGradient>
                  <linearGradient id="diamondBolt1" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#249361"/>
                    <stop offset="1" stopColor="#3ECF8E"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
