export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col bg-sidebar p-10 relative overflow-hidden flex-shrink-0">
        {/* Subtle geometric backdrop */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-sidebar-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-sidebar-primary blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 5C2 3.34315 3.34315 2 5 2H11C12.6569 2 14 3.34315 14 5V11C14 12.6569 12.6569 14 11 14H5C3.34315 14 2 12.6569 2 11V5Z" fill="white" fillOpacity="0.9"/>
                <path d="M5.5 8H10.5M8 5.5V10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-sidebar-foreground font-semibold text-base tracking-tight">
              StayFlow
            </span>
          </div>
        </div>

        {/* Testimonial / tagline */}
        <div className="relative z-10 mt-auto">
          <blockquote className="space-y-4">
            <p className="text-sidebar-foreground/80 text-sm leading-relaxed">
              "Managing stays for 300+ wedding guests used to take days of back-and-forth.
              StayFlow made it a matter of hours."
            </p>
            <footer>
              <p className="text-sidebar-foreground font-medium text-sm">Priya Mehta</p>
              <p className="text-sidebar-foreground/50 text-xs">Senior Event Planner, The Grand Celebrations</p>
            </footer>
          </blockquote>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-8 pt-8 border-t border-sidebar-border grid grid-cols-2 gap-6">
          {[
            { value: "2,400+", label: "Events managed" },
            { value: "180k+", label: "Guests tracked" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-sidebar-foreground text-2xl font-bold">{stat.value}</p>
              <p className="text-sidebar-foreground/50 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 5C2 3.34315 3.34315 2 5 2H11C12.6569 2 14 3.34315 14 5V11C14 12.6569 12.6569 14 11 14H5C3.34315 14 2 12.6569 2 11V5Z" fill="white" fillOpacity="0.9"/>
              <path d="M5.5 8H10.5M8 5.5V10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-foreground font-semibold text-base tracking-tight">
            StayFlow
          </span>
        </div>

        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
