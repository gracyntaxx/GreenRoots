import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="h-10 w-10 text-error" aria-hidden="true" />
          <h1 className="mt-3 text-xl font-bold text-ink">Something went wrong on this screen</h1>
          <p className="mt-1 max-w-md text-sm text-muted">
            Your saved data is safe. Reload the screen to try again. If this keeps happening, contact GreenRoots support.
          </p>
          {this.state.message && (
            <p className="mt-2 max-w-md rounded-lg bg-canvas px-3 py-2 text-[12px] text-muted">{this.state.message}</p>
          )}
          <Button className="mt-4" variant="primary" size="portal" onClick={() => window.location.reload()}>
            Reload screen
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
