import { useCallback, useEffect, useState } from 'react';
import {
  deleteCertificate,
  downloadCertificate,
  getApiErrorMessage,
  getCertificates,
} from '../services/api';
import type {
  CertificateListResponse,
  CertificateSummary,
  SearchField,
} from '../types/certificate';
import { SearchBar } from './SearchBar';

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));

const getCertificateId = (certificate: CertificateSummary): string =>
  certificate.id || certificate._id || certificate.uniqueCertificateId;

interface CertificateListProps {
  refreshToken?: number;
}

export function CertificateList({ refreshToken = 0 }: CertificateListProps) {
  const [data, setData] = useState<CertificateListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const loadCertificates = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getCertificates({
        page,
        limit: 10,
        searchTerm: searchTerm || undefined,
        searchField: searchTerm ? searchField : undefined,
      });
      setData(response);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [page, searchField, searchTerm]);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates, refreshToken]);

  const handleSearch = useCallback((term: string, field: SearchField) => {
    setSearchTerm(term);
    setSearchField(field);
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (certificate: CertificateSummary) => {
      const id = getCertificateId(certificate);
      const confirmed = window.confirm(
        `Delete certificate ${certificate.uniqueCertificateId} for ${certificate.participantName}?`
      );

      if (!confirmed) {
        return;
      }

      setDeletingId(id);
      setStatus('');
      setError('');

      try {
        await deleteCertificate(id);
        setStatus('Certificate deleted successfully');

        if (data?.certificates.length === 1 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        } else {
          await loadCertificates();
        }
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setDeletingId('');
      }
    },
    [data?.certificates.length, loadCertificates, page]
  );

  const totalPages = data?.pagination.totalPages || 1;

  return (
    <section className="panel list-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Records</p>
          <h2>Certificates</h2>
        </div>
        <SearchBar onSearch={handleSearch} />
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {status ? <div className="alert success">{status}</div> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Event</th>
              <th>Date</th>
              <th>ID</th>
              <th>Generated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="state-cell">
                  Loading certificates
                </td>
              </tr>
            ) : null}
            {!isLoading && data?.certificates.length === 0 ? (
              <tr>
                <td colSpan={7} className="state-cell">
                  No certificates found
                </td>
              </tr>
            ) : null}
            {!isLoading
              ? data?.certificates.map((certificate) => {
                  const id = getCertificateId(certificate);

                  return (
                    <tr key={id}>
                      <td>{certificate.participantName}</td>
                      <td>{certificate.role}</td>
                      <td>{certificate.eventOrInternship}</td>
                      <td>{formatDate(certificate.date)}</td>
                      <td className="mono">{certificate.uniqueCertificateId}</td>
                      <td>{formatDate(certificate.generatedAt)}</td>
                      <td>
                        <div className="download-actions">
                          {certificate.format !== 'image' ? (
                            <button
                              type="button"
                              className="icon-button"
                              title="Download PDF"
                              onClick={() => void downloadCertificate(id, 'pdf')}
                            >
                              PDF
                            </button>
                          ) : null}
                          {certificate.format !== 'pdf' ? (
                            <button
                              type="button"
                              className="icon-button"
                              title="Download image"
                              onClick={() => void downloadCertificate(id, 'image')}
                            >
                              PNG
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="icon-button danger-button"
                            disabled={deletingId === id}
                            title="Delete certificate"
                            onClick={() => void handleDelete(certificate)}
                          >
                            {deletingId === id ? 'Deleting' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          type="button"
          className="secondary-button"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="secondary-button"
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
