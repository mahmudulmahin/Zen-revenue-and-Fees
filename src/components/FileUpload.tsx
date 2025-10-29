import { Upload } from 'lucide-react';
import { useState } from 'react';

interface FileUploadProps {
  label: string;
  onFileUpload: (content: string) => void;
  accept?: string;
}

export const FileUpload = ({ label, onFileUpload, accept = '.csv,.tsv,.txt,.xlsx' }: FileUploadProps) => {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setLoading(true);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx') {
      try {
        const XLSX = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const wsname = workbook.SheetNames[0];
          const ws = workbook.Sheets[wsname];
          const csv = XLSX.utils.sheet_to_csv(ws, { FS: ',', RS: '\n' });
          setLoading(false);
          onFileUpload(csv);
        };
        reader.readAsArrayBuffer(file);
      } catch (e) {
        setLoading(false);
        alert('Failed to parse XLSX file. Please check your file or try CSV.');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setLoading(false);
      const content = e.target?.result as string;
      onFileUpload(content);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          loading
            ? 'border-blue-500 bg-blue-50'
            : isDragging
            ? 'border-blue-500 bg-blue-50'
            : fileName
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`file-upload-${label}`}
        />
        <label
          htmlFor={`file-upload-${label}`}
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className={`w-10 h-10 mb-2 ${fileName ? 'text-green-600' : 'text-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {loading
              ? 'Loading...'
              : fileName || 'Click to upload or drag and drop'}
          </span>
          {fileName && !loading && (
            <span className="text-xs text-green-600 mt-1 font-medium">{fileName}</span>
          )}
        </label>
      </div>
    </div>
  );
};