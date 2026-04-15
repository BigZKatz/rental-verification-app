"use client";

import { useTransition } from "react";
import { deleteRentalHistoryEntry } from "./actions";
import { Trash2 } from "lucide-react";

interface Props {
  entryId: string;
  applicantId: string;
}

export default function DeleteEntryButton({ entryId, applicantId }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Remove this rental history entry?")) return;
    startTransition(async () => {
      await deleteRentalHistoryEntry(entryId, applicantId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title="Delete entry"
      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-40"
      aria-label="Delete rental history entry"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
