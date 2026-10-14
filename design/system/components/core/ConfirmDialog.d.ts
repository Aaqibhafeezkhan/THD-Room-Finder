import type { ReactNode } from 'react';
/**
 * Centred confirmation on every window size (D2 delete profile). alertdialog,
 * initial focus on Cancel, the confirm action in error colour when the tone is
 * danger.
 */
export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    body?: ReactNode;
    confirmLabel: string;
    cancelLabel: string;
    tone?: 'danger' | 'default';
    onConfirm?: () => void;
    onCancel?: () => void;
    contained?: boolean;
}
/**
 * @startingPoint section="Core" subtitle="Destructive confirmation (alertdialog)" viewport="700x300"
 */
export declare function ConfirmDialog(props: ConfirmDialogProps): JSX.Element;
