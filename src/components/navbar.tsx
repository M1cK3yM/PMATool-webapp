import { ModeToggle } from "@/components/mode-toggle"

export function NavBar() {
  return (
    <header className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto max-w-[1200px] px-4 h-14 flex items-center justify-between">
        <div className="font-semibold tracking-tight">PMA</div>
        <ModeToggle />
      </div>
    </header>
  )
}

