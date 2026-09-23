"use client";

interface ErrorPageProps {
  error: Error;
  retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-4xl grow flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <p className="font-heading text-6xl font-semibold text-muted-foreground">Signal</p>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-md text-muted-foreground">
        This page hit an error. It&apos;s probably transient — try again.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={retry}
          className="rounded-sm bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-sm border border-input px-4 py-2 font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Back to Signal
        </a>
      </div>
      <p className="text-xs text-muted-foreground">{error.message}</p>
    </main>
  );
}