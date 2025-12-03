import { describe, it, expect } from 'vitest'
import {
  ACTIVITY_CONFIGS,
  ACTIVITY_TYPES,
  getActivityPoints,
  getActivityLabel,
  type ActivityType,
} from './activityPoints'

describe('Activity configuration', () => {
  const ALL_ACTIVITY_TYPES: ActivityType[] = [
    'blog_post',
    'cfp_submission',
    'conference_talk',
    'meetup_talk',
    'hosted_meetup',
    'customer_support',
    'oss_contribution',
    'video_tutorial',
    'documentation',
    'workshop',
    'mentorship',
    'starter_template',
    'integration',
    'community_answers',
  ]

  describe('when accessing activity configurations', () => {
    it('should have configuration for all 14 activity types', () => {
      expect(Object.keys(ACTIVITY_CONFIGS)).toHaveLength(14)

      for (const type of ALL_ACTIVITY_TYPES) {
        expect(ACTIVITY_CONFIGS[type]).toBeDefined()
      }
    })

    it('should have all required fields for each activity type', () => {
      for (const type of ALL_ACTIVITY_TYPES) {
        const config = ACTIVITY_CONFIGS[type]

        expect(config.type).toBe(type)
        expect(config.label).toBeDefined()
        expect(typeof config.label).toBe('string')
        expect(config.label.length).toBeGreaterThan(0)

        expect(config.points).toBeDefined()
        expect(typeof config.points).toBe('number')
        expect(config.points).toBeGreaterThan(0)

        expect(config.icon).toBeDefined()
        expect(typeof config.icon).toBe('string')

        expect(config.description).toBeDefined()
        expect(typeof config.description).toBe('string')

        expect(Array.isArray(config.requiredFields)).toBe(true)
      }
    })

    it('should have ACTIVITY_TYPES array matching ACTIVITY_CONFIGS', () => {
      expect(ACTIVITY_TYPES).toHaveLength(14)

      const typesFromArray = ACTIVITY_TYPES.map((config) => config.type)
      const typesFromConfigs = Object.keys(ACTIVITY_CONFIGS)

      expect(typesFromArray.sort()).toEqual(typesFromConfigs.sort())
    })
  })

  describe('when getting activity points', () => {
    it('should return correct points for each activity type', () => {
      // High-value activities (100 points)
      expect(getActivityPoints('conference_talk')).toBe(100)
      expect(getActivityPoints('workshop')).toBe(100)
      expect(getActivityPoints('hosted_meetup')).toBe(100)

      // Medium-high value activities (75 points)
      expect(getActivityPoints('meetup_talk')).toBe(75)
      expect(getActivityPoints('oss_contribution')).toBe(75)
      expect(getActivityPoints('video_tutorial')).toBe(75)
      expect(getActivityPoints('integration')).toBe(75)

      // Standard activities (50 points)
      expect(getActivityPoints('blog_post')).toBe(50)
      expect(getActivityPoints('documentation')).toBe(50)
      expect(getActivityPoints('mentorship')).toBe(50)
      expect(getActivityPoints('starter_template')).toBe(50)

      // Lower-value activities (25 points)
      expect(getActivityPoints('cfp_submission')).toBe(25)
      expect(getActivityPoints('customer_support')).toBe(25)
      expect(getActivityPoints('community_answers')).toBe(25)
    })

    it('should return points for all valid activity types', () => {
      for (const type of ALL_ACTIVITY_TYPES) {
        const points = getActivityPoints(type)

        expect(points).toBeGreaterThan(0)
        expect([25, 50, 75, 100]).toContain(points)
      }
    })
  })

  describe('when getting activity labels', () => {
    it('should return human-readable labels', () => {
      expect(getActivityLabel('blog_post')).toBe('Published a blog post')
      expect(getActivityLabel('cfp_submission')).toBe('Submitted a CFP')
      expect(getActivityLabel('conference_talk')).toBe('Spoke at a conference')
      expect(getActivityLabel('meetup_talk')).toBe('Spoke at a meetup')
      expect(getActivityLabel('hosted_meetup')).toBe('Hosted a meetup')
      expect(getActivityLabel('customer_support')).toBe('Supported a customer')
      expect(getActivityLabel('oss_contribution')).toBe('Contributed to Supabase OSS')
      expect(getActivityLabel('video_tutorial')).toBe('Created a video tutorial')
      expect(getActivityLabel('documentation')).toBe('Wrote documentation')
      expect(getActivityLabel('workshop')).toBe('Organized a workshop')
      expect(getActivityLabel('mentorship')).toBe('Mentored a developer')
      expect(getActivityLabel('starter_template')).toBe('Created a starter template')
      expect(getActivityLabel('integration')).toBe('Built an integration')
      expect(getActivityLabel('community_answers')).toBe('Answered community questions')
    })

    it('should return labels for all valid activity types', () => {
      for (const type of ALL_ACTIVITY_TYPES) {
        const label = getActivityLabel(type)

        expect(label).toBeDefined()
        expect(label.length).toBeGreaterThan(0)
        // Labels should be title case (start with capital letter)
        expect(label[0]).toBe(label[0].toUpperCase())
      }
    })
  })

  describe('required fields configuration', () => {
    it('should have URL as required for web-based activities', () => {
      const webActivities: ActivityType[] = [
        'blog_post',
        'video_tutorial',
        'documentation',
        'starter_template',
        'integration',
      ]

      for (const type of webActivities) {
        expect(ACTIVITY_CONFIGS[type].requiredFields).toContain('url')
      }
    })

    it('should have event-related fields for event activities', () => {
      const eventActivities: ActivityType[] = [
        'conference_talk',
        'meetup_talk',
        'hosted_meetup',
        'workshop',
      ]

      for (const type of eventActivities) {
        const fields = ACTIVITY_CONFIGS[type].requiredFields
        expect(fields).toContain('eventName')
      }
    })
  })

  describe('point value tiers', () => {
    it('should have speaking/organizing activities at highest tier (100 points)', () => {
      const highTierActivities: ActivityType[] = [
        'conference_talk',
        'workshop',
        'hosted_meetup',
      ]

      for (const type of highTierActivities) {
        expect(getActivityPoints(type)).toBe(100)
      }
    })

    it('should have creation/contribution activities at medium-high tier (75 points)', () => {
      const mediumHighActivities: ActivityType[] = [
        'meetup_talk',
        'oss_contribution',
        'video_tutorial',
        'integration',
      ]

      for (const type of mediumHighActivities) {
        expect(getActivityPoints(type)).toBe(75)
      }
    })

    it('should have content activities at standard tier (50 points)', () => {
      const standardActivities: ActivityType[] = [
        'blog_post',
        'documentation',
        'mentorship',
        'starter_template',
      ]

      for (const type of standardActivities) {
        expect(getActivityPoints(type)).toBe(50)
      }
    })

    it('should have quick-win activities at entry tier (25 points)', () => {
      const entryActivities: ActivityType[] = [
        'cfp_submission',
        'customer_support',
        'community_answers',
      ]

      for (const type of entryActivities) {
        expect(getActivityPoints(type)).toBe(25)
      }
    })
  })
})
