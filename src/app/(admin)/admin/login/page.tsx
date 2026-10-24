'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginSuperAdminAction } from '@/app/actions/admin';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await loginSuperAdminAction({
        email,
        password,
      });

      if (!result.ok) {
        setErrorMsg(result.error || 'Invalid Super Admin credentials.');
        setIsSubmitting(false);
        return;
      }

      router.push('/admin');
    } catch {
      setErrorMsg('Unable to authenticate. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Build My Unicorn • Super Admin Portal
          </h1>
          <p className="text-xs text-slate-400">
            Restricted access. Only authorized Super Administrators can sign in.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Lock className="h-4 w-4 text-amber-400" />
              Super Admin Authentication
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your dedicated Super Admin credentials to manage founder
              accounts and entitlements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-slate-200">
                  Super Admin Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@buildmyunicorn.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-slate-200">
                  Super Admin Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter Super Admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>

              {errorMsg && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-950/60 p-3 text-xs font-medium text-rose-200">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying Super Admin...
                  </>
                ) : (
                  <>
                    Sign In to Admin Panel
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
