import * as React from 'react';
import { Heading, Text, Section, Button, Link } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface VoucherRedeemedEmailProps {
  founderName?: string;
  recipientEmail: string;
  voucherCode: string;
  tierName: string;
  maxPlans: number;
  maxSeats: number;
  aiCreditsMonthly: number;
  loginUrl: string;
  activatedDate?: string;
  validUntilDate?: string;
}

export const VoucherRedeemedEmail: React.FC<VoucherRedeemedEmailProps> = ({
  founderName,
  recipientEmail,
  voucherCode,
  tierName,
  maxPlans,
  maxSeats,
  aiCreditsMonthly,
  loginUrl,
  activatedDate,
  validUntilDate,
}) => {
  const greeting = founderName ? `Hi ${founderName},` : 'Hi Founder,';

  return (
    <EmailLayout previewText={`Code ${voucherCode} Redeemed — ${tierName} Unlocked`}>
      <Heading style={headingStyle}>Pass Activated! 🎉</Heading>

      <Text style={paragraphStyle}>{greeting}</Text>

      <Text style={paragraphStyle}>
        Your code <span style={codeBadgeStyle}>{voucherCode}</span> has been
        successfully redeemed. Your account now has full access to the{' '}
        <strong>{tierName}</strong>.
      </Text>

      {/* Unlocked Entitlements Overview */}
      <Section style={entitlementCardStyle}>
        <Text style={cardHeaderStyle}>SUBSCRIPTION & ENTITLEMENT DETAILS</Text>
        <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td style={statCellLeft}>Voucher Code:</td>
              <td style={statCellRight}>
                <span style={codeBadgeStyle}>{voucherCode}</span>
              </td>
            </tr>
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
            <tr>
              <td style={statCellLeft}>Startup Plans:</td>
              <td style={statCellRight}>
                <strong>{maxPlans} Plans</strong> (with Clone/Pivot)
              </td>
            </tr>
            <tr>
              <td style={statCellLeft}>Team / Co-Founder Seats:</td>
              <td style={statCellRight}>
                <strong>{maxSeats} Seats</strong> (Module F Alignment Unlocked)
              </td>
            </tr>
            <tr>
              <td style={statCellLeft}>Monthly AI Underwriting Credits:</td>
              <td style={statCellRight}>
                <strong>{aiCreditsMonthly} Credits / Mo</strong>
              </td>
            </tr>
            <tr>
              <td style={statCellLeft}>Official Grant Compiler:</td>
              <td style={statCellRight}>
                <strong>IE LEO + UK Innovate UK + SEIS</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section style={ctaSectionStyle}>
        <Button style={buttonStyle} href={loginUrl}>
          Enter Your Workspace →
        </Button>
      </Section>

      <Text style={footerNoteStyle}>
        Need to add co-founders? Open Module F inside your workspace and click
        "Invite Co-Founder" to trigger their blind-reveal alignment interview.
      </Text>

      <Text style={supportNoteStyle}>
        Have questions about your subscription, setup, or grants? Reply directly to this email or contact me personally at{' '}
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

const footerNoteStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#64748b',
  margin: '16px 0 0 0',
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
