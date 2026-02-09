import './globals.css';

export const metadata = {
  title: 'Virtual Spirograph',
  description: 'Create mesmerizing geometric patterns with this interactive spirograph simulator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
