import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ContractVault — AI Contract Management',
  description: 'Upload contracts, extract details with AI, and track renewals in one place.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1c1915',
                color: '#f6f4f0',
                fontSize: '14px',
                borderRadius: '2px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#f8fafc' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
