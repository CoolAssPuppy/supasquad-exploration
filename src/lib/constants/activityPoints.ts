/**
 * Activity Types and Points Configuration
 *
 * This file defines all activity types and their associated point values.
 * Update the points here to adjust the reward system.
 */

export type ActivityType =
  | 'blog_post'
  | 'cfp_submission'
  | 'conference_talk'
  | 'meetup_talk'
  | 'hosted_meetup'
  | 'customer_support'
  | 'oss_contribution'
  | 'video_tutorial'
  | 'documentation'
  | 'workshop'
  | 'mentorship'
  | 'starter_template'
  | 'integration'
  | 'community_answers';

export interface ActivityConfig {
  type: ActivityType;
  label: string;
  description: string;
  points: number;
  requiredFields: string[];
  icon: string;
}

export const ACTIVITY_CONFIGS: Record<ActivityType, ActivityConfig> = {
  blog_post: {
    type: 'blog_post',
    label: 'Published a blog post',
    description: 'Wrote and published a blog post about Supabase',
    points: 50,
    requiredFields: ['title', 'url'],
    icon: 'pencil',
  },
  cfp_submission: {
    type: 'cfp_submission',
    label: 'Submitted a CFP',
    description: 'Submitted a Call for Papers to speak about Supabase',
    points: 25,
    requiredFields: ['eventName', 'title'],
    icon: 'document',
  },
  conference_talk: {
    type: 'conference_talk',
    label: 'Spoke at a conference',
    description: 'Gave a talk about Supabase at a conference',
    points: 100,
    requiredFields: ['eventName', 'title', 'eventDate'],
    icon: 'microphone',
  },
  meetup_talk: {
    type: 'meetup_talk',
    label: 'Spoke at a meetup',
    description: 'Gave a talk about Supabase at a local meetup',
    points: 75,
    requiredFields: ['eventName', 'title', 'eventDate'],
    icon: 'users',
  },
  hosted_meetup: {
    type: 'hosted_meetup',
    label: 'Hosted a meetup',
    description: 'Organized and hosted a Supabase meetup',
    points: 100,
    requiredFields: ['eventName', 'location', 'eventDate', 'attendeeCount'],
    icon: 'calendar',
  },
  customer_support: {
    type: 'customer_support',
    label: 'Supported a customer',
    description: 'Helped a community member with their Supabase project',
    points: 25,
    requiredFields: ['description'],
    icon: 'chat',
  },
  oss_contribution: {
    type: 'oss_contribution',
    label: 'Contributed to Supabase OSS',
    description: 'Made a contribution to Supabase open source projects',
    points: 75,
    requiredFields: ['url', 'description'],
    icon: 'code',
  },
  video_tutorial: {
    type: 'video_tutorial',
    label: 'Created a video tutorial',
    description: 'Created and published a video tutorial about Supabase',
    points: 75,
    requiredFields: ['title', 'url'],
    icon: 'video',
  },
  documentation: {
    type: 'documentation',
    label: 'Wrote documentation',
    description: 'Contributed to Supabase documentation',
    points: 50,
    requiredFields: ['url', 'description'],
    icon: 'book',
  },
  workshop: {
    type: 'workshop',
    label: 'Organized a workshop',
    description: 'Led a hands-on Supabase workshop',
    points: 100,
    requiredFields: ['eventName', 'eventDate', 'attendeeCount'],
    icon: 'academic',
  },
  mentorship: {
    type: 'mentorship',
    label: 'Mentored a developer',
    description: 'Provided mentorship on Supabase to another developer',
    points: 50,
    requiredFields: ['description'],
    icon: 'heart',
  },
  starter_template: {
    type: 'starter_template',
    label: 'Created a starter template',
    description: 'Built and published a Supabase starter template',
    points: 50,
    requiredFields: ['url', 'description'],
    icon: 'template',
  },
  integration: {
    type: 'integration',
    label: 'Built an integration',
    description: 'Created an integration or plugin for Supabase',
    points: 75,
    requiredFields: ['url', 'description'],
    icon: 'puzzle',
  },
  community_answers: {
    type: 'community_answers',
    label: 'Answered community questions',
    description: 'Answered questions on Discord, GitHub, or Stack Overflow',
    points: 25,
    requiredFields: ['platform', 'answerCount'],
    icon: 'question',
  },
};

export const ACTIVITY_TYPES = Object.values(ACTIVITY_CONFIGS);

export function getActivityPoints(type: ActivityType): number {
  return ACTIVITY_CONFIGS[type]?.points ?? 0;
}

export function getActivityLabel(type: ActivityType): string {
  return ACTIVITY_CONFIGS[type]?.label ?? type;
}
