import * as React from 'react';
import { Heading, Text, Section, Button } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface QuoteRfpPartnerInviteEmailProps {
  partnerName: string;
  projectTitle: string;
  category: string;
  countryCode: string;
  currency: string;
  budgetRange: string;
  targetTimeline: string;
  scopeSummary: string;
  workPackagesCount: number;
  magicPortalUrl: string;
}

export const QuoteRfpPartnerInviteEmail: React.FC<QuoteRfpPartnerInviteEmailProps> = ({
  partnerName,
  projectTitle,
  category,
  countryCode,
  currency,
  budgetRange,
  targetTimeline,
  scopeSummary,
  workPackagesCount,
  magicPortalUrl,
}) => {
  return (
    <EmailLayout previewText={`[New RFP] Quote Request for ${projectTitle} (${countryCode})`}>
      <Heading style={headingStyle}>New Project RFP &amp; Quote Request ⚡</Heading>

      <Text style={paragraphStyle}>
        Hi <strong>{partnerName}</strong>,
      </Text>

      <Text style={paragraphStyle}>
        A vetted startup founder on <strong>Startup Preflight</strong> has selected you as a preferred supplier candidate to quote for their upcoming project:
      </Text>

      {/* Project Overview Card */}
      <Section style={rfpCardStyle}>
        <div style={titleHeaderStyle}>
          <span style={projectTitleStyle}>{projectTitle}</span>
          <span style={badgeStyle}>{category}</span>
        </div>

        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={tableLabelStyle}>Country &amp; Currency:</td>
              <td style={tableValueStyle}>{countryCode} ({currency})</td>
            </tr>
            <tr>
              <td style={tableLabelStyle}>Estimated Budget:</td>
              <td style={tableValueStyle}>{budgetRange}</td>
            </tr>
            <tr>
              <td style={tableLabelStyle}>Target Timeline:</td>
              <td style={tableValueStyle}>{targetTimeline}</td>
            </tr>
            <tr>
              <td style={tableLabelStyle}>Work Packages:</td>
              <td style={tableValueStyle}>{workPackagesCount} Defined Milestone Packages</td>
            </tr>
          </tbody>
        </table>

        <div style={scopeBoxStyle}>
          <Text style={scopeLabelStyle}>Project Scope Summary:</Text>
          <Text style={scopeTextStyle}>{scopeSummary}</Text>
        </div>
      </Section>

      <Section style={ctaSectionStyle}>
        <Button style={buttonStyle} href={magicPortalUrl}>
          Review Full RFP &amp; Submit Quote (Magic Link) →
        </Button>
      </Section>

      <Section style={guidanceCardStyle}>
        <Text style={guidanceTitleStyle}>Why This Matters (Grant Underwriting):</Text>
        <Text style={guidanceTextStyle}>
          This client is preparing an official government grant application (e.g. Ireland LEO Feasibility/Priming or UK Innovate UK), which requires formal written quotations. Winning quotes often convert into guaranteed grant-funded commercial contracts.
        </Text>
      </Section>

      <Text style={footerNoteStyle}>
        No account or password is required. You can use your secure Magic Link above to view all work package details and upload your quotation letter.
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

const rfpCardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};

const titleHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
};

const projectTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#0f172a',
};

const badgeStyle: React.CSSProperties = {
  backgroundColor: '#ede9fe',
  color: '#6366f1',
  fontSize: '11px',
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '12px 0',
};

const tableLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#64748b',
  padding: '4px 0',
  width: '40%',
};

const tableValueStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#0f172a',
  padding: '4px 0',
};

const scopeBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '12px',
};

const scopeLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  margin: '0 0 4px 0',
};

const scopeTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '19px',
  color: '#334155',
  margin: 0,
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#d97706',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '12px 24px',
  boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)',
};

const guidanceCardStyle: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
};

const guidanceTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#92400e',
  margin: '0 0 4px 0',
};

const guidanceTextStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#78350f',
  margin: 0,
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
  margin: '20px 0 0 0',
};
