import { ChevronDown, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';

type Option = string | { value: string; label: string };

interface MultiSelectProps {
  label: string;
  options: Option[];
  selected: string[]; // values
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelect = ({ label, options, selected, onChange, placeholder = 'Select...' }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalized = useMemo(() => {
    return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  }, [options]);

  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();
    normalized.forEach((o) => map.set(o.value, o.label));
    return map;
  }, [normalized]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="border border-gray-300 rounded-lg px-4 py-2 cursor-pointer bg-white hover:border-gray-400 transition-colors min-h-[42px] flex items-center justify-between"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            ) : (
              selected.map(option => (
                <span
                  key={option}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                >
                  {labelByValue.get(option) || option}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-blue-600"
                    onClick={(e) => removeOption(option, e)}
                  />
                </span>
              ))
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {normalized.length === 0 ? (
              <div className="px-4 py-2 text-gray-400 text-sm">No options available</div>
            ) : (
              normalized.map(option => (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                    selected.includes(option.value) ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(option.value)}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};