import LayoutWrapper from '@/app/components/LayoutWrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
