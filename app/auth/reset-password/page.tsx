import { Suspense } from 'react';
import ResetPasswordClient from './reset-password-client';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
