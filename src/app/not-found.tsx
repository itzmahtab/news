import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-4xl grow flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="font-heading text-6xl font-semibold text-muted-foreground">404</p>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Signal lost this page
      </h1>
      <p className="max-w-md text-muted-foreground">
        The story or address you followed doesn&apos;t exist. Head back to the
        front page for the latest across all seven verticals.
      </p>
      <Link
        href="/"
        className="rounded-sm bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Back to Signal
      </Link>
    </main>
  );
}