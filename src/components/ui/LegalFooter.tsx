// src/components/ui/LegalFooter.tsx
import React from "react";
import { Link } from "react-router-dom";

export const LegalFooter: React.FC = () => {
  return (
    <footer className="w-full py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-neu-muted">
      <Link to="/privacy" className="hover:text-neu-accent transition-colors">
        Privacy
      </Link>
      <span aria-hidden="true" className="opacity-40">
        •
      </span>
      <Link to="/terms" className="hover:text-neu-accent transition-colors">
        Terms
      </Link>
      <span aria-hidden="true" className="opacity-40">
        •
      </span>
      <Link to="/refunds" className="hover:text-neu-accent transition-colors">
        Refunds
      </Link>
      <span aria-hidden="true" className="opacity-40">
        •
      </span>
      <Link to="/contact" className="hover:text-neu-accent transition-colors">
        Contact
      </Link>
    </footer>
  );
};