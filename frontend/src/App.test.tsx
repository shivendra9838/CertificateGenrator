import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./services/api', () => ({
  deleteCertificate: jest.fn(),
  downloadCertificate: jest.fn(),
  generateCertificate: jest.fn(),
  getApiErrorMessage: jest.fn(() => 'Request failed'),
  getCertificates: jest.fn().mockResolvedValue({
    certificates: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      limit: 10,
    },
  }),
}));

describe('App', () => {
  it('renders primary navigation and dashboard route', async () => {
    render(
      <MemoryRouter
        initialEntries={['/']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /certificates/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /generate/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /new certificate/i })).toBeInTheDocument();
    expect(await screen.findByText(/no certificates found/i)).toBeInTheDocument();
  });

  it('renders the generate route', () => {
    render(
      <MemoryRouter
        initialEntries={['/generate']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /new certificate/i })).toBeInTheDocument();
  });
});
