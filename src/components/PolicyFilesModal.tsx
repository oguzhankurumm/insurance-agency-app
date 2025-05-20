import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface PolicyFile {
  id: number;
  policyId: number;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
}

interface PolicyFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: {
    id: number;
    policyNumber: string;
  };
}

export default function PolicyFilesModal({
  isOpen,
  onClose,
  policy,
}: PolicyFilesModalProps) {
  const [files, setFiles] = useState<PolicyFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, policy.id]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/policies/${policy.id}/files`);
      if (!response.ok) {
        throw new Error("Dosyalar alınamadı");
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Dosyalar alınırken hata:", error);
      setError("Dosyalar alınamadı");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {policy.policyNumber} - Poliçe Dosyaları
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Dosyalar yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-500">{error}</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  Bu poliçeye ait dosya bulunmamaktadır.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {file.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        İndir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Kapat
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
