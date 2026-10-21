'use client';

import React from 'react';

/**
 * Ponto de proteção da rota de dashboard.
 * Por agora deixa passar tudo (auth simulada / bypass).
 * Quando o backend tiver login e tokens, basta verificar a sessão aqui.
 */
export default function RequireAuth({ children }) {
  // TODO: Autenticação real (JWT / cookies de sessão / NextAuth)
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2>Acesso reservado</h2>
        <p>Inicie sessão para aceder à plataforma interna da Vidraria Mortágua.</p>
      </div>
    );
  }

  return <>{children}</>;
}
