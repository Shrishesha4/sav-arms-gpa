import { BookOpenCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center">
      <div className="inline-flex items-center gap-4">
        <BookOpenCheck className="w-12 h-12 text-primary" />
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline">
            CGPA Genie
          </h1>
          <p className="text-muted-foreground mt-1">
            Your AI-powered academic performance tracker.
          </p>
        </div>
      </div>
    </header>
  );
}
