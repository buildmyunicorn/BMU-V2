import * as React from 'react';
import { Heading, Text, Section, Button } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface QuoteRfpDispatchedFounderReceiptProps {
  founderName: string;
  planTitle: string;
  projectTitle: string;
  category: string;
  currency: string;
  budgetRange: string;
  partnersCount: number;
  partnerNames: string[];
  workspaceUrl: string;
}

export const QuoteRfpDispatchedFounderReceipt: React.FC<QuoteRfpDispatchedFounderReceiptProps> = ({
  founderName,
  planTitle,
  projectTitle,
  category,
  currency,
  budgetRange,
  partnersCount,
  partnerNames,
  workspaceUrl,
}) => {
  return (
    <EmailLayout previewText={`⚡ 3-Quote Request Dispatched for "${projectTitle}"`}>
      <Heading style={headingStyle}>Quotes Requested Successfully 🚀</Heading>

      <Text style={paragraphStyle}>
        Hi <strong>{founderName}</strong>,
      </Text>

      <Text style={paragraphStyle}>
        Your standardized project RFP for <span style={planBadgeStyle}>{planTitle}</span> has been dispatched to{' '}
        <strong>{partnersCount} vetted supplier partners</strong> for competitive quotation.
      </Text>

      {/* Dispatched Suppliers List */}
      <Section style={cardStyle}>
        <Text style={cardTitleStyle}>Dispatched Suppliers ({partnersCount})</Text>
        <ul style={listStyle}>
          {partnerNames.map((name, idx) => (
            <li key={idx} style={listItemStyle}>
              🏢 <strong>{name}</strong> — <em>RFP &amp; Magic Link Delivered</em>
            </li>
          ))}
        </ul>

        <div style={detailsGridStyle}>
          <div>
            <span style={labelStyle}>Category:</span> <strong>{category}</strong>
          </div>
          <div>
            <span style={labelStyle}>Budget Bracket:</span>{' '}
            <strong style={{ color: '#059669' }}>{budgetRange}</strong>
          </div>
        </div>
      </Section>

      <Section style={ctaSectionStyle}>
        <Button style={buttonStyle} href={workspaceUrl}>
          Open Quotes Tracker in Workspace →
        </Button>
      </Section>

      <Section style={infoBoxStyle}>
        <Text style={infoTitleStyle}>What Happens Next?</Text>
        <Text style={infoTextStyle}>
          1. Suppliers will review your work packages and upload formal quotation letters via their secure Magic Links.
          <br />
          2. As soon as a quote is submitted, you will receive an instant notification email, and the figure will appear in your workspace.
          <br />
          3. Uploaded quotation PDFs will automatically attach to <strong>Module L Appendix C</strong> ready for your grant application submission.
        </Text>
      </Section>

      <Text style={footerNoteStyle}>
        Startup Preflight • Automated Grant Compliance Concierge
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

const cardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
  margin: '0 0 12px 0',
};

const listStyle: React.CSSProperties = {
  listStyleType: 'none',
  padding: 0,
  margin: '0 0 16px 0',
};

const listItemStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#1e293b',
  padding: '6px 0',
  borderBottom: '1px solid #f1f5f9',
};

const detailsGridStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: '#475569',
  paddingTop: '8px',
};

const labelStyle: React.CSSProperties = {
  color: '#64748b',
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

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '14px 16px',
  margin: '16px 0',
};

const infoTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#166534',
  margin: '0 0 6px 0',
};

const infoTextStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '19px',
  color: '#14532d',
  margin: 0,
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
  margin: '20px 0 0 0',
};
