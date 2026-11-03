import * as React from 'react';
import { Heading, Text, Section, Button } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface CofounderInviteEmailProps {
  inviterName: string;
  planTitle: string;
  inviteeEmail: string;
  roleTitle?: string;
  acceptUrl: string;
}

export const CofounderInviteEmail: React.FC<CofounderInviteEmailProps> = ({
  inviterName,
  planTitle,
  inviteeEmail,
  roleTitle = 'Co-Founder',
  acceptUrl,
}) => {
  return (
    <EmailLayout previewText={`${inviterName} invited you to join "${planTitle}" on Startup Preflight`}>
      <Heading style={headingStyle}>Co-Founder Workspace Invitation 🤝</Heading>

      <Text style={paragraphStyle}>
        <strong>{inviterName}</strong> has invited you to collaborate as a{' '}
        <strong>{roleTitle}</strong> on their startup plan:{' '}
        <span style={planBadgeStyle}>{planTitle}</span>.
      </Text>

      <Text style={paragraphStyle}>
        Startup Preflight is an interactive venture planning & grant underwriting
        workspace. Once you accept, you will be able to review the concept, contribute
        to financial schedules, and complete the{' '}
        <strong>Module F Blind-Reveal Alignment Survey (12 Awkward Questions)</strong>.
      </Text>

      <Section style={ctaSectionStyle}>
        <Button style={buttonStyle} href={acceptUrl}>
          Accept Invitation & Open Plan →
        </Button>
      </Section>

      <Section style={infoCardStyle}>
        <Text style={infoTitleStyle}>About Blind-Reveal Alignment</Text>
        <Text style={infoTextStyle}>
          Before committing equity and personal savings, you and {inviterName} will
          independently answer 12 critical questions on equity expectations, runway,
          decision rights, and exit goals. Your individual answers remain hidden until
          both of you finish!
        </Text>
      </Section>

      <Text style={footerNoteStyle}>
        Invitation sent to {inviteeEmail}. If you were not expecting this, you can
        safely ignore this email.
      </Text>
    </EmailLayout>
  );
};

const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  lineHeight: '28px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 16px 0',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#334155',
  margin: '0 0 16px 0',
};

const planBadgeStyle: React.CSSProperties = {
  backgroundColor: '#ede9fe',
  color: '#5b21b6',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 700,
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#4f46e5',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 24px',
  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
};

const infoCardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '14px 18px',
  margin: '20px 0',
};

const infoTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#475569',
  margin: '0 0 6px 0',
};

const infoTextStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#475569',
  margin: 0,
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  margin: '16px 0 0 0',
};
