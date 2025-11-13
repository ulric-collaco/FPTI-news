export const metadata = {
  title: "FPTI News – Regulatory Summaries",
  description: "Latest Indian financial and tax regulatory news summaries",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `
        }} />
      </head>
      <body style={{
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        background: '#000',
        color: '#fff',
        margin: 0,
        minHeight: '100vh'
      }}>
        <main style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '3rem 1.5rem 4rem'
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
