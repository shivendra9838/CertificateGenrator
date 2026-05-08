import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CertificateForm } from './CertificateForm';
import { generateCertificate } from '../services/api';

jest.mock('../services/api', () => ({
  generateCertificate: jest.fn(),
  getApiErrorMessage: jest.fn(() => 'Request failed'),
}));

const mockedGenerateCertificate = generateCertificate as jest.MockedFunction<
  typeof generateCertificate
>;

describe('CertificateForm', () => {
  beforeEach(() => {
    mockedGenerateCertificate.mockReset();
  });

  it('renders all certificate input fields', () => {
    render(<CertificateForm />);

    expect(screen.getByLabelText(/participant name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^role$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/event or internship/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^date$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^pdf$/i)).toBeChecked();
    expect(screen.getByLabelText(/^image$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^both$/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(<CertificateForm />);

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    expect(await screen.findByText('Participant name is required')).toBeInTheDocument();
    expect(screen.getByText('Role is required')).toBeInTheDocument();
    expect(screen.getByText('Event or internship is required')).toBeInTheDocument();
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(mockedGenerateCertificate).not.toHaveBeenCalled();
  });

  it('submits valid form data and reports success', async () => {
    const onGenerated = jest.fn();
    mockedGenerateCertificate.mockResolvedValue({
      certificateId: 'cert-1',
      uniqueCertificateId: 'unique-1',
      issuedAt: '2026-05-08T00:00:00.000Z',
      issuedBy: 'Priya Sharma',
      downloadUrls: { pdf: '/download/pdf' },
    });

    render(<CertificateForm onGenerated={onGenerated} />);

    fireEvent.change(screen.getByLabelText(/participant name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByLabelText(/^role$/i), {
      target: { value: 'Developer' },
    });
    fireEvent.change(screen.getByLabelText(/event or internship/i), {
      target: { value: 'Internship' },
    });
    fireEvent.change(screen.getByLabelText(/^date$/i), {
      target: { value: '2026-05-08' },
    });
    fireEvent.click(screen.getByLabelText(/^both$/i));
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(mockedGenerateCertificate).toHaveBeenCalledWith({
        participantName: 'Jane Doe',
        role: 'Developer',
        eventOrInternship: 'Internship',
        date: '2026-05-08',
        format: 'both',
      });
    });

    expect(await screen.findByText(/unique-1 generated/i)).toBeInTheDocument();
    expect(onGenerated).toHaveBeenCalledTimes(1);
  });
});
