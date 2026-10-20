import type { CSSProperties, ReactNode } from 'react';
/**
 * The table page's main card (M2): the seat ring, then the topic and three
 * short lines (when, where, who). On phones the tag and the ring sit on top;
 * on wide windows the ring sits left of the details, the tag above the
 * topic, and the actions move into the card.
 */
export interface StudyTableCardProps {
    ring: ReactNode;
    topic: string;
    when: ReactNode;
    where: ReactNode;
    who?: ReactNode;
    /** One TableTag above the topic. */
    tag?: ReactNode;
    /** Ring beside the details instead of above them. */
    wide?: boolean;
    /** Muted topic, for cancelled or ended tables. */
    muted?: boolean;
    /** Actions; inside the card next to the details on wide windows. */
    children?: ReactNode;
    style?: CSSProperties;
}
/**
 * @startingPoint section="Study tables" subtitle="Table page card: ring, topic, when, where, who" viewport="760x420"
 */
export declare function StudyTableCard(props: StudyTableCardProps): JSX.Element;
