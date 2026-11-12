import * as React from 'react';
import { Heading, Text, Section, Button, Link } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface AdminNewUserSignupEmailProps {
  founderName?: string;
  founderEmail: string;
  authMethod: 'EMAIL_PASSWORD' | 'GOOGLE_OAUTH';
  tierName: string;
  hqCountry?: 'IE' | 'GB' | 'GLOBAL';
  registeredAt: string;
  voucherCode?: string;
  cohortName?: string;
  adminDashboardUrl: string;
}

export const AdminNewUserSignupEmail: React.FC<AdminNewUserSignupEmailProps> = ({
  founderName,
  founderEmail,
  authMethod = 'EMAIL_PASSWORD',
  tierName = 'Free Ideation Hook',
  hqCountry = 'IE',
  registeredAt,
  voucherCode,
  cohortName,
  adminDashboardUrl,
}) => {
  const flag = hqCountry === 'GB' ? '🇬🇧' : hqCountry === 'IE' ? '🇮🇪' : '🌍';
  const countryLabel =
    hqCountry === 'GB'
      ? 'United Kingdom'
      : hqCountry === 'IE'
      ? 'Ireland'
      : 'Global / Other';

  const authLabel =
    authMethod === 'GOOGLE_OAUTH' ? 'Google OAuth ⚡' : 'Email & Password 🔑';

  const userDisplayName = founderName ? `${founderName} (${founderEmail})` : founderEmail;

  return (
    <EmailLayout previewText={`⚡ New Founder Signup: ${founderEmail} on ${tierName}`}>
      <Heading style={headingStyle}>New Founder Registration 🚀</Heading>

      <Text style={paragraphStyle}>
        A new founder just signed up on <strong>Startup Preflight</strong>. Here are the registration details:
      </Text>

      {/* Founder Overview Card */}
      <Section style={cardStyle}>
        <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td style={statCellLeft}>Founder:</td>
              <td style={statCellRight}>
                <strong>{userDisplayName}</strong>
              </td>
            </tr>
            <tr>
              <td style={statCellLeft}>Account Email:</td>
              <td style={statCellRight}>
                <span style={codeBadgeStyle}>{founderEmail}</span>
              </td>
            </tr>
            <tr>
              <td style={statCellLeft}>Auth Method:</td>
              <td style={statCellRight}>
                <strong>{authLabel}</strong>
              </td>
            </tr>
            <tr>
              <td style={statCellLeft}>Target Tier / Pass:</td>
              <td style={statCellRight}>
                <span style={tierBadgeStyle}>{tierName}</span>
              </td>
            </tr>
            <tr>
              <td style={statCellLeft}>Detected Region:</td>
              <td style={statCellRight}>
                <span>
                  {flag} {countryLabel}
                </span>
              </td>
            </tr>
            {voucherCode && (
              <tr>
                <td style={statCellLeft}>Invite / Voucher:</td>
                <td style={statCellRight}>
                  <span style={voucherBadgeStyle}>{voucherCode}</span>
                </td>
              </tr>
            )}
            {cohortName && (
              <tr>
                <td style={statCellLeft}>Cohort:</td>
                <td style={statCellRight}>
                  <strong>{cohortName}</strong>
                </td>
              </tr>
            )}
            {registeredAt && (
              <tr>
                <td style={statCellLeft}>Signed Up At:</td>
                <td style={statCellRight}>
                  <span style={dateStyle}>{registeredAt}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Primary Action Button */}
      <Section style={ctaSectionStyle}>
        <Button
          style={primaryButtonStyle}
          href={`${adminDashboardUrl}?search=${encodeURIComponent(founderEmail)}`}
        >
          View Founder in Admin Studio &rarr;
        </Button>
      </Section>

      {/* Control Notice */}
      <Section style={noticeBoxStyle}>
        <Text style={noticeTextStyle}>
          ⚙️ <strong>Admin Notification Setting:</strong> You are receiving this because{' '}
          <em>Instant Signup Alerts</em> are active in your{' '}
          <Link href={adminDashboardUrl} style={inlineLinkStyle}>
            System Emails Studio
          </Link>
          . You can disable this anytime from the Admin Studio with a single toggle.
        </Text>
      </Section>
    </EmailLayout>
  );
};

// -------------------------------------------------------------
// STYLES (Sovereign Emerald & Deep Slate)
// -------------------------------------------------------------
const headingStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#020617', // slate-950
  margin: '0 0 16px',
  letterSpacing: '-0.4px',
};

const paragraphStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#334155', // slate-700
  margin: '0 0 16px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc', // slate-50
  border: '1px solid #e2e8f0', // slate-200
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '20px 0',
};

const statCellLeft: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#64748b', // slate-500
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '7px 0',
  width: '38%',
  verticalAlign: 'middle',
};

const statCellRight: React.CSSProperties = {
  fontSize: '13px',
  color: '#0f172a', // slate-900
  padding: '7px 0',
  verticalAlign: 'middle',
};

const codeBadgeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '12px',
  fontWeight: '600',
  backgroundColor: '#e2e8f0',
  color: '#0f172a',
  padding: '3px 8px',
  borderRadius: '4px',
  display: 'inline-block',
};

const tierBadgeStyle: React.CSSProperties = {
  fontFamily: 'sans-serif',
  fontSize: '11px',
  fontWeight: '700',
  backgroundColor: '#ecfdf5', // emerald-50
  color: '#065f46', // emerald-800
  border: '1px solid #a7f3d0', // emerald-200
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-block',
};

const voucherBadgeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '11px',
  fontWeight: '700',
  backgroundColor: '#fef3c7', // amber-100
  color: '#92400e', // amber-800
  border: '1px solid #fde68a', // amber-200
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-block',
};

const dateStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#475569',
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0 20px',
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#047857', // emerald-700
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '11px 22px',
  borderRadius: '8px',
  display: 'inline-block',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

const noticeBoxStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9', // slate-100
  border: '1px solid #cbd5e1', // slate-300
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '20px 0 0',
};

const noticeTextStyle: React.CSSProperties = {
  fontSize: '11px',
  lineHeight: '17px',
  color: '#475569', // slate-600
  margin: 0,
};

const inlineLinkStyle: React.CSSProperties = {
  color: '#047857',
  textDecoration: 'underline',
  fontWeight: '600',
};
