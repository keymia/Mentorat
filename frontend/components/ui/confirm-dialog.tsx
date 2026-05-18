"use client";

import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  isConfirming?: boolean;
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  confirmVariant = "danger",
  isConfirming = false,
  children,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      className="max-w-lg"
      onClose={() => {
        if (!isConfirming) {
          onCancel();
        }
      }}
    >
      <div className="grid gap-5">
        {children ? <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">{children}</div> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={() => void onConfirm()} disabled={isConfirming}>
            {isConfirming ? "Suppression..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
