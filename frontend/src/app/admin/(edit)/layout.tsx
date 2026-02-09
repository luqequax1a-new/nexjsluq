export default function AdminEditLayout({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay: React.ReactNode;
}) {
  return (
    <>
      {children}
      {overlay}
    </>
  );
}

export const dynamic = "force-dynamic";
