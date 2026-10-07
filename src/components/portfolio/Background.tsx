export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      {/* Top subtle glow for depth */}
      <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(255,255,255,0.04),transparent)]" />

      {/* Faint grid */}
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,black,transparent)]" />
    </div>
  );
}
