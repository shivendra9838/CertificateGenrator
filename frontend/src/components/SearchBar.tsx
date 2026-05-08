import { useEffect, useState } from 'react';
import type { SearchField } from '../types/certificate';

interface SearchBarProps {
  onSearch: (searchTerm: string, searchField: SearchField) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('name');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onSearch(searchTerm.trim(), searchField);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [onSearch, searchField, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('', searchField);
  };

  return (
    <div className="search-bar">
      <label className="field-label" htmlFor="certificate-search">
        Search
      </label>
      <div className="search-controls">
        <input
          id="certificate-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Name or certificate ID"
        />
        <select
          value={searchField}
          onChange={(event) => setSearchField(event.target.value as SearchField)}
          aria-label="Search field"
        >
          <option value="name">Name</option>
          <option value="id">ID</option>
        </select>
        <button type="button" className="secondary-button" onClick={clearSearch}>
          Clear
        </button>
      </div>
    </div>
  );
}
