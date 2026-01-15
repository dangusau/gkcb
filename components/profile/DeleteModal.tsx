import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  type: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<Props> = ({ type, name, isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const getTypeLabel = () => {
    switch (type) {
      case 'post': return 'post';
      case 'listing': return 'marketplace listing';
      case 'business': return 'business';
      case 'job': return 'job posting';
      case 'event': return 'event';
      default: return 'item';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl">
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete {getTypeLabel()}</h3>
            <p className="text-gray-600">
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;