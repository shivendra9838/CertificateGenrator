import { useState } from 'react';
import { CertificateForm } from '../components/CertificateForm';
import { CertificateList } from '../components/CertificateList';

export function Dashboard() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="dashboard-grid">
      <CertificateForm onGenerated={() => setRefreshToken((current) => current + 1)} />
      <CertificateList refreshToken={refreshToken} />
    </div>
  );
}
