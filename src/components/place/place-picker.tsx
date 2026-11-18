'use client';

export type PlacePickerProps = {
  /** Selected place id, or null when none. */
  value: string | null;
  /** Called with the new place id (existing or just created), or null when cleared. */
  onChange: (placeId: string | null) => void;
};

/**
 * Field that lets the user pick a saved place or create one (name, address, Maps link)
 * from a bottom sheet. Used by the pose form.
 *
 * Owner: places phase (replaces this stub).
 */
export function PlacePicker(props: PlacePickerProps): React.ReactElement {
  void props;
  throw new Error('not implemented');
}
