// external
import { useId, type ReactNode } from "react";

// internal
import "./InfoTip.css";

export default function InfoTip({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: ReactNode;
}) {
  const id = useId();

  return (
    <span className="info-tip">
      <button
        type="button"
        className="info-tip-btn"
        aria-label={label}
        aria-describedby={id}
        onClick={(e) => e.currentTarget.focus()}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.blur();
        }}
      >
        ?
      </button>
      <span role="tooltip" id={id} className="info-tip-bubble">
        {title && <div className="info-tip-title">{title}</div>}
        {children}
      </span>
    </span>
  );
}
