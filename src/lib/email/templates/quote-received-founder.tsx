import * as React from 'react';
import { Heading, Text, Section, Button } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface QuoteReceivedFounderEmailProps {
  founderName: string;
  planTitle: string;
  partnerName: string;
  partnerLogo?: string;
  quoteAmountNet: string;
  quoteCurrency: string;
  estimatedWeeks?: number | null;
  quoteNotes?: string | null;
  quoteFileUrl?: string | null;
  workspaceUrl: string;
}

export const QuoteReceivedFounderEmail: React.FC<QuoteReceivedFounderEmailProps> = ({
  founderName,
  planTitle,
  partnerName,
  partnerLogo = '🏢',
  quoteAmountNet,
  quoteCurrency,
  estimatedWeeks,
  quoteNotes,
  quoteFileUrl,
  workspaceUrl,
}) => {
  return (
    <EmailLayout previewText={`🎉 Quote Received: ${partnerName} quoted ${quoteCurrency} ${quoteAmountNet} for ${planTitle}`}>
      <Heading style={headingStyle}>
        Official Supplier Quote Received! 🎉
      </Heading>

      <Text style={paragraphStyle}>
        Hi <strong>{founderName}</strong>,
      </Text>

      <Text style={paragraphStyle}>
        Great news! <strong>{partnerLogo} {partnerName}</strong> has reviewed your project RFP for{' '}
        <span style={planBadgeStyle}>{planTitle}</span> and submitted an official quotation letter.
      </Text>

      {/* Quote Summary Box */}
      <Section style={quoteCardStyle}>
        <Text style={quoteTitleStyle}>Quotation Overview</Text>
        <div style={priceHeroStyle}>
          {quoteCurrency} {quoteAmountNet}
          <span style={vatNoteStyle}> excl. VAT</span>
        </div>

        {estimatedWeeks && (
          <Text style={timelineStyle}>
            ⏱️ Estimated Delivery: <strong>{estimatedWeeks} weeks</strong>
          </Text>
        )}

        {quoteNotes && (
          <div style={notesBoxStyle}>
            <Text style={notesLabelStyle}>Supplier Notes &amp; Scope Breakdown:</Text>
            <Text style={notesTextStyle}>&ldquo;{quoteNotes}&rdquo;</Text>
          </div>
        )}
      </Section>

      <Section style={ctaSectionStyle}>
        <Button style={buttonStyle} href={workspaceUrl}>
          Review &amp; Accept Quote in Workspace →
        </Button>
      </Section>

      {quoteFileUrl && (
        <Text style={attachmentNoteStyle}>
          📎 The supplier&apos;s quotation document has been automatically attached to your{' '}
          <strong>Module L Appendix C (Supplier Quotations Schedule)</strong> for grant underwriting.
        </Text>
      )}

      <Text style={footerNoteStyle}>
        Need changes or clarification? You can communicate directly with {partnerName} or update your project RFP at any time from your Startup Preflight dashboard.
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
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 700,
};

const quoteCardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};

const quoteTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#64748b',
  margin: '0 0 8px 0',
};

const priceHeroStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: '#059669',
  margin: '0 0 8px 0',
};

const vatNoteStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#64748b',
};

const timelineStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#334155',
  margin: '0 0 12px 0',
};

const notesBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '12px',
};

const notesLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  margin: '0 0 4px 0',
};

const notesTextStyle: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: '18px',
  color: '#1e293b',
  fontStyle: 'italic',
  margin: 0,
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

const attachmentNoteStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#475569',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '10px 14px',
  margin: '16px 0',
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
  margin: '20px 0 0 0',
};
