import DashboardShell from '../../components/DashboardShell';

export default async function ObraDetalhePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id || null;
  return <DashboardShell initialView="escritorio" initialPage="obras" initialObraId={id} />;
}
