// internal
import { Skeleton, SkeletonLabel } from "../Skeleton";

function CardSkeleton({
  slot,
  lines,
  tall,
}: {
  slot: string;
  lines: number[];
  tall?: number;
}) {
  return (
    <section className={`card oc-card ${slot}`}>
      <Skeleton width={130} height={16} style={{ marginBottom: 18 }} />
      <div className="skeleton-stack" style={{ gap: 12 }}>
        {lines.map((width, index) => (
          <Skeleton key={index} width={`${width}%`} height={14} />
        ))}
      </div>
      {tall ? (
        <Skeleton height={tall} radius={10} style={{ marginTop: 16 }} />
      ) : null}
    </section>
  );
}

/** Stepper + two-column grid placeholders, same footprint as the real page. */
export default function OutreachBodySkeleton() {
  return (
    <>
      <SkeletonLabel text="Loading company" />

      <div className="oc-stepper-skeleton" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-inline" style={{ flex: 1 }}>
            <Skeleton width={28} height={28} radius="50%" />
            <Skeleton width={70} height={13} />
          </div>
        ))}
      </div>

      <div className="oc-grid">
        <div className="oc-col">
          <CardSkeleton slot="oc-slot-next" lines={[90, 70]} tall={44} />
          <CardSkeleton slot="oc-slot-contact" lines={[55, 70, 45]} />
          <CardSkeleton slot="oc-slot-notes" lines={[]} tall={170} />
        </div>
        <div className="oc-col">
          <CardSkeleton slot="oc-slot-readiness" lines={[80, 65, 72, 50]} />
          <CardSkeleton slot="oc-slot-files" lines={[]} tall={64} />
          <CardSkeleton slot="oc-slot-activity" lines={[85, 70, 78, 60]} />
        </div>
      </div>
    </>
  );
}
