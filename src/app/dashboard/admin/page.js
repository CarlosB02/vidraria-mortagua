import { redirect } from 'next/navigation';
// import DashboardShell from '../components/DashboardShell';

// Ocultado temporariamente para deploy na Vercel (basta descomentar a linha do DashboardShell para reativar)
export default function AdminPage() {
  redirect('/dashboard');
  // return <DashboardShell initialView="admin" initialPage="inicio" />;
}
