import * as React from 'react';
import { Heading, Text, Section, Button } from '@react-email/components';
import { EmailLayout } from './components/layout';

export interface PasswordResetEmailProps {
  recipientEmail: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  recipientEmail,
  resetUrl,
  expiresInMinutes = 60,
}) => {
  return (
    <EmailLayout previewText="Reset your Startup Preflight password">
      <Heading style={headingStyle}>Password Reset Request 🔐</Heading>

      <Text style={paragraphStyle}>
        We received a request to reset the password for your Startup Preflight
        account associated with <strong>{recipientEmail}</strong>.
      </Text>

      <Section style={ctaSectionStyle}>
        <Button style={buttonStyle} href={resetUrl}>
          Reset Your Password →
        </Button>
      </Section>

      <Text style={paragraphStyle}>
        This password reset link is valid for the next{' '}
        <strong>{expiresInMinutes} minutes</strong>. If you did not request a
        password reset, you can safely ignore this email — your account remains
        fully secure.
      </Text>

      <Section style={warningCardStyle}>
        <Text style={warningTextStyle}>
          <strong>Security Notice:</strong> Never forward or share this link
          with anyone. Startup Preflight staff will never ask for your password or
          reset link.
        </Text>
      </Section>
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

const warningCardStyle: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '20px 0',
};

const warningTextStyle: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#991b1b',
  margin: 0,
};
