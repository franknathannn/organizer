import { cn } from "@/lib/utils";

interface CoverImageProps {
  src?: string;
  darkSrc?: string;
  className?: string;
}

export function CoverImage({ src = "/cover.jpg", darkSrc, className }: CoverImageProps) {
  const resolvedDarkSrc = darkSrc || src;
  
  return (
    <div className={cn("relative h-32 md:h-40 w-full overflow-hidden shrink-0", className)}>
      <div 
        className="absolute inset-0 bg-cover bg-center dark:hidden blur-[1px] scale-[1.02]" 
        style={{ backgroundImage: `url("${src}")` }}
      />
      <div 
        className="absolute inset-0 bg-cover bg-center hidden dark:block blur-[1px] scale-[1.02]" 
        style={{ backgroundImage: `url("${resolvedDarkSrc}")` }}
      />
    </div>
  );
}
