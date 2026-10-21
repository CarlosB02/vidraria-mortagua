import './styles/dashboard.css';
import RequireAuth from './components/RequireAuth';
import { DashboardProvider } from './context/DashboardContext';

export const metadata = {
  title: 'Gestão de Cavaletes | Vidraria Mortágua',
  description: 'Aplicação interna de gestão de cavaletes, entregas, recolhas e controlo de prazos de 6 meses.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }) {
  return (
    <RequireAuth>
      <DashboardProvider>
        {children}
      </DashboardProvider>
    </RequireAuth>
  );
}
