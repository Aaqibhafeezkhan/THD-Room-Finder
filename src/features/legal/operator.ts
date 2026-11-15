/**
 * Who runs the app, for the imprint. One place, so the notice and the
 * imprint cannot disagree.
 *
 * `address` is the maintainer's to fill in (#248): a postal address he is
 * willing to publish. Until it is set the imprint says that the postal
 * address is missing. `email` is the address he chose for contact.
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
  email: 'alex.rudaev@outlook.com',
  repository: 'https://github.com/arudaev/THD-Room-Finder',
};
