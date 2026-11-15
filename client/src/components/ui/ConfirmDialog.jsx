import React, { useState } from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  confirmTextMatch = null,
  loading = false
}) => {
  const [matchInput, setMatchInput] = useState('');

  const isMatchValid = confirmTextMatch ? matchInput === confirmTextMatch : true;

  const handleConfirm = () => {
    if (isMatchValid) {
      onConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>

        {confirmTextMatch && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-700">
              Please type <span className="font-bold select-all bg-slate-100 px-1 py-0.5 rounded text-rose-600">{confirmTextMatch}</span> to confirm:
            </p>
            <Input
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={confirmTextMatch}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={!isMatchValid}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
