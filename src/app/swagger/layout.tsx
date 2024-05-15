export const metadata = {
  title: "Adamik API",
  description: "Adamik OpenAPI reference",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
