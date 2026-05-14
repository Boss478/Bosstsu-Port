/"/**
 * Navigation pending indicator bar.
 * Shows a pulsing progress bar at the top during navigation transitions.
 */

interface NavigationPendingBarProps {
  isPending: boolean;
}

export function NavigationPendingBar({ isPending }: NavigationPendingBarProps) {
  if (!isPending) return null;
  
  return (
    <div className="fixed top-16 left-0 right-0 z-[60] pointer-events-none">
      <div className="h-0.5 bg-sky-500 animate-pulse" />
    </div>
  );
}
