import { BookOpenCheck, ChartNoAxesCombined } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center">
      <div className="inline-flex items-center gap-4">
        <div className="p-3 bg-primary/20 rounded-lg">
          <ChartNoAxesCombined className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground font-headline">
            ARMS GPA
          </h1>
        </div>
      </div>
    </header>
  );
}
