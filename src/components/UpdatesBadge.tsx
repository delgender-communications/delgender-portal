// external
import { useState } from "react";
import { FiBell } from "react-icons/fi";

/**
 * The bell and the number beside "Updates".
 *
 * The number pops in with a ring pulsing out of it and the bell gives a little
 * shake. When it's cleared it shrinks away. It keeps showing the last number
 * while it shrinks, so it never flashes "0".
 */
export function UpdatesBell({ count }: { count: number }) {
  const [shown, setShown] = useState(count);
  if (count > 0 && count !== shown) setShown(count);

  const visible = count > 0;

  return (
    <span className="updates-bell-wrap">
      {/* A new key restarts the shake each time the number changes. */}
      <span
        key={visible ? shown : "idle"}
        className={`updates-bell${visible ? " ringing" : ""}`}
      >
        <FiBell size={18} />
      </span>
      <span
        className={`updates-dot${visible ? " on" : ""}`}
        aria-hidden="true"
      />
    </span>
  );
}

export function UpdatesCount({ count }: { count: number }) {
  const [shown, setShown] = useState(count);
  if (count > 0 && count !== shown) setShown(count);

  const visible = count > 0;

  return (
    <span
      className={`updates-count${visible ? " on" : ""}`}
      role={visible ? "status" : undefined}
      aria-label={visible ? `${count} new updates` : undefined}
      aria-hidden={!visible}
    >
      {/* A new key replays the pop when the number changes. */}
      <span key={shown} className="updates-count-num">
        {shown > 99 ? "99+" : shown}
      </span>
    </span>
  );
}
