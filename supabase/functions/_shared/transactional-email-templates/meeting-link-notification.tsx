import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "TechWindows AI Bootcamp"

interface MeetingLinkNotificationProps {
  childName?: string
  date?: string
  startTime?: string
  endTime?: string
  meetLink?: string
  trainerName?: string
}

const MeetingLinkNotificationEmail = ({
  childName,
  date,
  startTime,
  endTime,
  meetLink,
  trainerName,
}: MeetingLinkNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Meeting link for your upcoming session on {date || 'your scheduled date'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎓 Session Meeting Link</Heading>
        <Text style={text}>
          Hi! Your trainer{trainerName ? ` ${trainerName}` : ''} has shared the meeting link for
          {childName ? ` ${childName}'s` : ' your'} upcoming session.
        </Text>

        <Section style={detailsBox}>
          <Text style={detailLabel}>📅 Date</Text>
          <Text style={detailValue}>{date || 'TBD'}</Text>
          <Text style={detailLabel}>⏰ Time</Text>
          <Text style={detailValue}>{startTime || ''} - {endTime || ''}</Text>
          {trainerName && (
            <>
              <Text style={detailLabel}>👨‍🏫 Trainer</Text>
              <Text style={detailValue}>{trainerName}</Text>
            </>
          )}
        </Section>

        {meetLink && (
          <Section style={{ textAlign: 'center' as const, margin: '30px 0' }}>
            <Button style={button} href={meetLink}>
              Join Meeting
            </Button>
          </Section>
        )}

        <Text style={linkText}>
          Or copy this link: {meetLink || ''}
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          Best regards,<br />The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MeetingLinkNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Meeting Link for Session on ${data.date || 'your scheduled date'}`,
  displayName: 'Meeting link notification',
  previewData: {
    childName: 'Arjun',
    date: '2026-04-15',
    startTime: '10:00',
    endTime: '11:00',
    meetLink: 'https://meet.google.com/abc-def-ghi',
    trainerName: 'Coach Priya',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#1e1b3a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = {
  backgroundColor: '#f8f7ff',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 10px',
  border: '1px solid #e8e6f0',
}
const detailLabel = { fontSize: '12px', color: '#8b8b9e', margin: '0 0 2px', fontWeight: '600' as const, textTransform: 'uppercase' as const }
const detailValue = { fontSize: '15px', color: '#1e1b3a', margin: '0 0 14px', fontWeight: '500' as const }
const button = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: '600' as const,
  textDecoration: 'none',
}
const linkText = { fontSize: '12px', color: '#999', wordBreak: 'break-all' as const, margin: '0 0 20px' }
const hr = { borderColor: '#e8e6f0', margin: '20px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0' }
