import React, { useRef } from 'react';

interface PullUpHandleProps {
  onClose: () => void;
  className?: string;
  barClassName?: string;
  label?: string;
}

const CLOSE_DRAG_THRESHOLD = 28;

const PullUpHandle: React.FC<PullUpHandleProps> = ({
  onClose,
  className = 'mx-auto mb-4 flex h-7 w-20 items-center justify-center',
  barClassName = 'h-1 w-12 rounded-full bg-slate-200 dark:bg-white/20',
  label = 'Close pull-up panel',
}) => {
  const pointerStartY = useRef<number | null>(null);

  return (
    <button
      type="button"
      className={`${className} cursor-grab touch-none rounded-full active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70`}
      aria-label={label}
      onClick={onClose}
      onPointerDown={(event) => {
        pointerStartY.current = event.clientY;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        const startY = pointerStartY.current;
        pointerStartY.current = null;
        if (startY !== null && event.clientY - startY > CLOSE_DRAG_THRESHOLD) {
          onClose();
        }
      }}
      onPointerCancel={() => {
        pointerStartY.current = null;
      }}
    >
      <span className={barClassName} aria-hidden="true" />
    </button>
  );
};

export default PullUpHandle;
