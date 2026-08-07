export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Soft cool base wash */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8faff_0%,#eef3ff_45%,#e9f6fc_100%)]" />

      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(60rem_28rem_at_50%_-12%,rgb(140_170_255_/_0.22),transparent_62%)]" />

      {/* Floating color orbs */}
      <div className="absolute -left-24 -top-32 h-[34rem] w-[34rem] rounded-full bg-sky-300/40 blur-3xl" />
      <div className="absolute -right-40 top-1/3 h-[38rem] w-[38rem] rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-cyan-200/50 blur-3xl" />
      <div className="absolute right-1/4 top-2/3 h-72 w-72 rounded-full bg-violet-300/35 blur-3xl" />
      <div className="absolute left-1/2 top-24 h-56 w-56 rounded-full bg-amber-200/25 blur-3xl" />

      {/* Faint grid, fading toward the bottom */}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,black,transparent)]" />
    </div>
  );
}
