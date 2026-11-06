import * as React from 'react';
import { Heading, Text, Section, Button, Link } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface WelcomeFounderEmailProps {
  founderName?: string;
  loginEmail: string;
  loginUrl: string;
  tierName?: string;
  hqCountry?: 'IE' | 'GB' | 'GLOBAL';
  activatedDate?: string;
  validUntilDate?: string;
  voucherCode?: string;
  maxPlans?: number;
  maxSeats?: number;
  aiCreditsMonthly?: number;
}

export const WelcomeFounderEmail: React.FC<WelcomeFounderEmailProps> = ({
  founderName,
  loginEmail,
  loginUrl,
  tierName = '6-Month Founder Pass',
  hqCountry = 'IE',
  activatedDate,
  validUntilDate,
  voucherCode,
  maxPlans,
  maxSeats,
  aiCreditsMonthly,
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

      {/* Subscription Breakdown Card (if activated with code or pass) */}
      {(activatedDate || validUntilDate || voucherCode) && (
        <Section style={entitlementCardStyle}>
          <Text style={cardHeaderStyle}>SUBSCRIPTION & ENTITLEMENT DETAILS</Text>
          <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
            <tbody>
              {voucherCode && (
                <tr>
                  <td style={statCellLeft}>Voucher Code:</td>
                  <td style={statCellRight}>
                    <span style={codeBadgeStyle}>{voucherCode}</span>
                  </td>
                </tr>
              )}
              <tr>
                <td style={statCellLeft}>Plan / Tier:</td>
                <td style={statCellRight}>
                  <strong>{tierName}</strong>
                </td>
              </tr>
              {activatedDate && (
                <tr>
                  <td style={statCellLeft}>Activated On:</td>
                  <td style={statCellRight}>
                    <strong>{activatedDate}</strong>
                  </td>
                </tr>
              )}
              {validUntilDate && (
                <tr>
                  <td style={statCellLeft}>Valid Until:</td>
                  <td style={statCellRight}>
                    <strong style={validUntilDate.includes('Lifetime') ? lifetimeStyle : undefined}>
                      {validUntilDate}
                    </strong>
                  </td>
                </tr>
              )}
              {typeof maxPlans === 'number' && (
                <tr>
                  <td style={statCellLeft}>Startup Plans:</td>
                  <td style={statCellRight}>
                    <strong>{maxPlans} Plans</strong> (with Clone/Pivot)
                  </td>
                </tr>
              )}
              {typeof maxSeats === 'number' && (
                <tr>
                  <td style={statCellLeft}>Team / Co-Founder Seats:</td>
                  <td style={statCellRight}>
                    <strong>{maxSeats} Seats</strong>
                  </td>
                </tr>
              )}
              {typeof aiCreditsMonthly === 'number' && (
                <tr>
                  <td style={statCellLeft}>Monthly AI Underwriting Credits:</td>
                  <td style={statCellRight}>
                    <strong>{aiCreditsMonthly} Credits / Mo</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Section>
      )}

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

      <Text style={supportNoteStyle}>
        Have questions or need help setting up? Reply directly to this email or contact me personally at{' '}
        <Link href="mailto:Tom@startuppreflight.com" style={linkStyle}>
          Tom@startuppreflight.com
        </Link>
        .
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

const codeBadgeStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '2px 6px',
  fontFamily: 'monospace',
  fontWeight: 700,
  color: '#0f172a',
};

const entitlementCardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};

const cardHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#475569',
  margin: '0 0 12px 0',
};

const statCellLeft: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748b',
  padding: '6px 0',
};

const statCellRight: React.CSSProperties = {
  fontSize: '13px',
  color: '#0f172a',
  textAlign: 'right',
  padding: '6px 0',
};

const lifetimeStyle: React.CSSProperties = {
  color: '#059669', // emerald green
};

const supportNoteStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#475569',
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '10px 14px',
  margin: '20px 0 0 0',
};

const linkStyle: React.CSSProperties = {
  color: '#4f46e5',
  textDecoration: 'underline',
  fontWeight: 600,
};
