import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CertificateList } from './CertificateList';
import { deleteCertificate, downloadCertificate, getCertificates } from '../services/api';

jest.mock('../services/api', () => ({
  deleteCertificate: jest.fn(),
  downloadCertificate: jest.fn(),
  getApiErrorMessage: jest.fn(() => 'Unable to load certificates'),
  getCertificates: jest.fn(),
}));

const mockedGetCertificates = getCertificates as jest.MockedFunction<typeof getCertificates>;
const mockedDownloadCertificate = downloadCertificate as jest.MockedFunction<
  typeof downloadCertificate
>;
const mockedDeleteCertificate = deleteCertificate as jest.MockedFunction<typeof deleteCertificate>;

describe('CertificateList', () => {
  beforeEach(() => {
    mockedGetCertificates.mockReset();
    mockedDownloadCertificate.mockReset();
    mockedDeleteCertificate.mockReset();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders certificate rows and download actions', async () => {
    mockedGetCertificates.mockResolvedValue({
      certificates: [
        {
          id: 'cert-1',
          participantName: 'Jane Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2026-05-08T00:00:00.000Z',
          uniqueCertificateId: 'unique-1',
          generatedAt: '2026-05-08T01:00:00.000Z',
          format: 'both',
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 1,
        limit: 10,
      },
    });

    render(<CertificateList />);

    expect(screen.getByText(/loading certificates/i)).toBeInTheDocument();
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'PDF' }));
    expect(mockedDownloadCertificate).toHaveBeenCalledWith('cert-1', 'pdf');
  });

  it('deletes a confirmed certificate and refreshes the list', async () => {
    mockedGetCertificates
      .mockResolvedValueOnce({
        certificates: [
          {
            id: 'cert-1',
            participantName: 'Jane Doe',
            role: 'Developer',
            eventOrInternship: 'Internship',
            date: '2026-05-08T00:00:00.000Z',
            uniqueCertificateId: 'unique-1',
            generatedAt: '2026-05-08T01:00:00.000Z',
            format: 'both',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 1,
          limit: 10,
        },
      })
      .mockResolvedValueOnce({
        certificates: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          limit: 10,
        },
      });
    mockedDeleteCertificate.mockResolvedValue({
      certificateId: 'cert-1',
      uniqueCertificateId: 'unique-1',
    });

    render(<CertificateList />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mockedDeleteCertificate).toHaveBeenCalledWith('cert-1');
    });
    expect(await screen.findByText('Certificate deleted successfully')).toBeInTheDocument();
    expect(await screen.findByText(/no certificates found/i)).toBeInTheDocument();
  });

  it('does not delete when the confirmation is cancelled', async () => {
    jest.mocked(window.confirm).mockReturnValue(false);
    mockedGetCertificates.mockResolvedValue({
      certificates: [
        {
          id: 'cert-1',
          participantName: 'Jane Doe',
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2026-05-08T00:00:00.000Z',
          uniqueCertificateId: 'unique-1',
          generatedAt: '2026-05-08T01:00:00.000Z',
          format: 'both',
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 1,
        limit: 10,
      },
    });

    render(<CertificateList />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockedDeleteCertificate).not.toHaveBeenCalled();
  });

  it('requests filtered data after search', async () => {
    mockedGetCertificates.mockResolvedValue({
      certificates: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10,
      },
    });

    render(<CertificateList />);

    await screen.findByText(/no certificates found/i);
    fireEvent.change(screen.getByLabelText(/^search$/i), {
      target: { value: 'Jane' },
    });

    await waitFor(
      () => {
        expect(mockedGetCertificates).toHaveBeenLastCalledWith({
          page: 1,
          limit: 10,
          searchTerm: 'Jane',
          searchField: 'name',
        });
      },
      { timeout: 1000 }
    );
  });

  it('shows API failures', async () => {
    mockedGetCertificates.mockRejectedValue(new Error('Network error'));

    render(<CertificateList />);

    expect(await screen.findByText('Unable to load certificates')).toBeInTheDocument();
  });
});
