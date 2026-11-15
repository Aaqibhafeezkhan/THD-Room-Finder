/**
 * Who runs the app, for the imprint. One place, so the notice and the
 * imprint cannot disagree.
 *
 * `address` and `email` are the maintainer's to fill in (#248): a postal
 * address and a contact address he is willing to publish. Until they are set
 * the imprint shows the name and the public repository as the way to reach
 * him, and says that the postal address is missing.
 */
export interface Operator {
  name: string;
  /** Lines of a postal address, or null until the maintainer provides one. */
  address: string[] | null;
  /** A public contact address, or null until the maintainer provides one. */
  email: string | null;
  repository: string;
}

export const OPERATOR: Operator = {
  name: 'Alexander Rudaev',
  address: null,
  email: null,
  repository: 'https://github.com/arudaev/THD-Room-Finder',
};
