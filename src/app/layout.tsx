import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ContractVault — AI Contract Management',
  description: 'Intelligent contract management powered by AI. Upload, extract, track and manage all your contracts in one place.',
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
                background: '#1e293b',
                color: '#f8fafc',
                fontSize: '14px',
                borderRadius: '10px',
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
