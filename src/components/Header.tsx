import { BookOpenCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center">
      <div className="inline-flex items-center gap-4">
        <div className="p-3 bg-primary/20 rounded-lg">
          <BookOpenCheck className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground font-headline">
            ARMS GPA
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI-powered academic performance tracker.
          </p>
        </div>
      </div>
    </header>
  );
}
