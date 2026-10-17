/**
 * "Still focusing in E 212?" (D1). Asked about once an hour so rooms don't stay
 * claimed after you leave; with no answer the session ends when the lease runs
 * out. Bottom sheet on phones, dialog on larger windows. Keep Going is the
 * main action and takes initial focus.
 */
export interface CheckInSheetProps {
    open: boolean;
    /** "Still focusing in E 212?" */
    title: string;
    /** "24:10 · E 212" */
    meta: string;
    /** "We ask about once an hour so rooms don't stay claimed after you leave. …" */
    body: string;
    endLabel: string;
    keepLabel: string;
    onKeep?: () => void;
    onEnd?: () => void;
    variant?: 'sheet' | 'dialog';
    contained?: boolean;
}
/**
 * @startingPoint section="Focus" subtitle="Break is over / still focusing, before the next block" viewport="420x320"
 */
export declare function CheckInSheet(props: CheckInSheetProps): JSX.Element;
