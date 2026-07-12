import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-sm">
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-graphite-400 mb-6">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">{cancelLabel}</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              danger
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                : 'bg-lime text-graphite-950 hover:bg-lime-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
