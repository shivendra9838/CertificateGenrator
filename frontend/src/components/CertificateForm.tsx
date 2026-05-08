import { FormEvent, useState } from 'react';
import { generateCertificate, getApiErrorMessage } from '../services/api';
import type {
  CertificateFormat,
  CertificateInput,
  GenerateCertificateResponse,
} from '../types/certificate';

const initialForm: CertificateInput = {
  participantName: '',
  role: '',
  eventOrInternship: '',
  date: '',
  format: 'pdf',
};

interface CertificateFormProps {
  onGenerated?: () => void;
}

export function CertificateForm({ onGenerated }: CertificateFormProps) {
  const [form, setForm] = useState<CertificateInput>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CertificateInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [result, setResult] = useState<GenerateCertificateResponse | null>(null);

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof CertificateInput, string>> = {};

    if (!form.participantName.trim()) {
      nextErrors.participantName = 'Participant name is required';
    }
    if (!form.role.trim()) {
      nextErrors.role = 'Role is required';
    }
    if (!form.eventOrInternship.trim()) {
      nextErrors.eventOrInternship = 'Event or internship is required';
    }
    if (!form.date) {
      nextErrors.date = 'Date is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field: keyof CertificateInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError('');
    setResult(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const generated = await generateCertificate(form);
      setResult(generated);
      setForm(initialForm);
      onGenerated?.();
    } catch (error) {
      setApiError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="panel form-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Generate</p>
          <h2>New Certificate</h2>
        </div>
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Generating' : 'Generate'}
        </button>
      </div>

      {apiError ? <div className="alert error">{apiError}</div> : null}
      {result ? (
        <div className="alert success">Certificate {result.uniqueCertificateId} generated.</div>
      ) : null}

      <div className="form-grid">
        <label>
          <span>Participant Name</span>
          <input
            value={form.participantName}
            onChange={(event) => updateField('participantName', event.target.value)}
            aria-invalid={Boolean(errors.participantName)}
          />
          {errors.participantName ? <small>{errors.participantName}</small> : null}
        </label>

        <label>
          <span>Role</span>
          <input
            value={form.role}
            onChange={(event) => updateField('role', event.target.value)}
            aria-invalid={Boolean(errors.role)}
          />
          {errors.role ? <small>{errors.role}</small> : null}
        </label>

        <label className="span-2">
          <span>Event or Internship</span>
          <input
            value={form.eventOrInternship}
            onChange={(event) => updateField('eventOrInternship', event.target.value)}
            aria-invalid={Boolean(errors.eventOrInternship)}
          />
          {errors.eventOrInternship ? <small>{errors.eventOrInternship}</small> : null}
        </label>

        <label>
          <span>Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => updateField('date', event.target.value)}
            aria-invalid={Boolean(errors.date)}
          />
          {errors.date ? <small>{errors.date}</small> : null}
        </label>

        <fieldset>
          <legend>Format</legend>
          {(['pdf', 'image', 'both'] as CertificateFormat[]).map((format) => (
            <label className="radio-row" key={format}>
              <input
                type="radio"
                name="format"
                checked={form.format === format}
                onChange={() => updateField('format', format)}
              />
              <span>{format.toUpperCase()}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </form>
  );
}
