import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  previewText,
  children,
}) => {
  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header Brand Banner */}
          <Section style={headerStyle}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td align="left" style={{ verticalAlign: 'middle' }}>
                    <div style={logoBadgeStyle}>
                      <span style={logoTextStyle}>⚡ STARTUP PREFLIGHT</span>
                    </div>
                  </td>
                  <td align="right" style={{ verticalAlign: 'middle' }}>
                    <span style={headerSubtextStyle}>FOUNDER SYSTEM</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Email Body Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Institutional / Trust Footer */}
          <Section style={footerStyle}>
            <Hr style={dividerStyle} />
            <Text style={footerTextStyle}>
              <strong>Startup Preflight</strong> — The Structured Co-Founder &
              Underwriting Readiness Engine.
            </Text>
            <Text style={footerSubtextStyle}>
              Built for Ireland (LEO / Enterprise Ireland) & UK (Innovate UK /
              Start Up Loans / HMRC SEIS) founders.
            </Text>
            <Text style={footerAddressStyle}>
              Startup Preflight Ltd · Dublin & London ·{' '}
              <Link
                href="https://startuppreflight.com"
                style={footerLinkStyle}
              >
                startuppreflight.com
              </Link>{' '}
              ·{' '}
              <Link
                href="mailto:support@startuppreflight.com"
                style={footerLinkStyle}
              >
                support@startuppreflight.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles (Inline for bulletproof email client rendering)
const mainStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: '0',
  padding: '24px 0',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px 28px',
  maxWidth: '580px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
};

const headerStyle: React.CSSProperties = {
  paddingBottom: '20px',
  borderBottom: '1px solid #f1f5f9',
  marginBottom: '28px',
};

const logoBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#4338ca',
  padding: '6px 12px',
  borderRadius: '6px',
};

const logoTextStyle: React.CSSProperties = {
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '13px',
  letterSpacing: '0.05em',
};

const headerSubtextStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const contentStyle: React.CSSProperties = {
  padding: '0 4px',
};

const footerStyle: React.CSSProperties = {
  marginTop: '32px',
  textAlign: 'center',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#f1f5f9',
  margin: '24px 0 20px 0',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#475569',
  lineHeight: '18px',
  margin: '0 0 4px 0',
};

const footerSubtextStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  lineHeight: '16px',
  margin: '0 0 12px 0',
};

const footerAddressStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  lineHeight: '16px',
  margin: '0',
};

const footerLinkStyle: React.CSSProperties = {
  color: '#4f46e5',
  textDecoration: 'none',
};
