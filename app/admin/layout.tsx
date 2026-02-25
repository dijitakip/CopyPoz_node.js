import LayoutWrapper from '@/app/components/LayoutWrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
