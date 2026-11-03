import * as React from 'react';
import { Heading, Text, Section, Button, Link } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface WelcomeFounderEmailProps {
  founderName?: string;
  loginEmail: string;
  loginUrl: string;
  tierName?: string;
  hqCountry?: 'IE' | 'GB' | 'GLOBAL';
}

export const WelcomeFounderEmail: React.FC<WelcomeFounderEmailProps> = ({
  founderName,
  loginEmail,
  loginUrl,
  tierName = '6-Month Founder Pass',
  hqCountry = 'IE',
}) => {
  const greeting = founderName ? `Hi ${founderName},` : 'Hi Founder,';
  const grantScope =
    hqCountry === 'GB'
      ? 'Innovate UK, Start Up Loans & SEIS'
      : 'LEO Feasibility, Priming & Enterprise Ireland';

  return (
    <EmailLayout previewText="Welcome to Startup Preflight — Your Founder Workspace is Ready">
      <Heading style={headingStyle}>Welcome to Startup Preflight 🚀</Heading>

      <Text style={paragraphStyle}>{greeting}</Text>

      <Text style={paragraphStyle}>
        Your founder account has been provisioned on the{' '}
        <strong>{tierName}</strong>. Startup Preflight is your structured,
        supportive co-founder and underwriting blind-spot engine designed to take
        you from raw idea to fully underwritten institutional plan for{' '}
        <strong>{grantScope}</strong>.
      </Text>

      {/* Primary Call to Action */}
      <Section style={ctaSectionStyle}>
        <Button style={buttonStyle} href={loginUrl}>
          Launch Your Founder Workspace →
        </Button>
      </Section>

      {/* Quick Launch Checklist */}
      <Section style={checklistCardStyle}>
        <Text style={checklistTitleStyle}>
          Recommended First 30 Minutes:
        </Text>
        <Text style={checklistItemStyle}>
          <strong>1. Complete Module A (Ideation):</strong> Extract your 1-Page
          Concept Canvas and test instant live domain availability.
        </Text>
        <Text style={checklistItemStyle}>
          <strong>2. Invite Your Co-Founders:</strong> Run the Module F Blind-Reveal
          Alignment Survey (12 Awkward Questions).
        </Text>
        <Text style={checklistItemStyle}>
          <strong>3. Check Grant Matcher (Module K):</strong> Screen non-dilutive
          grant readiness across €2.7k–€100k+ in grants and investor tax relief.
        </Text>
      </Section>

      <Text style={noteStyle}>
        Account email:{' '}
        <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>
          {loginEmail}
        </span>
      </Text>

      <Text style={paragraphStyle}>
        If you have any questions or need mentor escalation, simply reply to
        this email or reach our support team anytime.
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

const checklistCardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '20px 0',
};

const checklistTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#475569',
  margin: '0 0 10px 0',
};

const checklistItemStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#334155',
  margin: '0 0 8px 0',
};

const noteStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  margin: '16px 0 8px 0',
};
