import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('debounces search input and emits the selected field', async () => {
    const onSearch = jest.fn();

    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText(/search field/i), {
      target: { value: 'id' },
    });
    fireEvent.change(screen.getByLabelText(/^search$/i), {
      target: { value: 'abc-123' },
    });

    await waitFor(
      () => {
        expect(onSearch).toHaveBeenLastCalledWith('abc-123', 'id');
      },
      { timeout: 1000 }
    );
  });

  it('clears the search term', async () => {
    const onSearch = jest.fn();

    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText(/^search$/i), {
      target: { value: 'Jane' },
    });
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(screen.getByLabelText(/^search$/i)).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('', 'name');
  });
});
