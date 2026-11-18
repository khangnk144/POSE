'use client';

import { Component, useSyncExternalStore, type ReactNode } from 'react';

/**
 * Keeps the form usable if the place picker fails to render (it is owned by another
 * feature): shows a short note instead of crashing the whole page.
 */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="text-sm text-text-2">Chưa chọn được địa điểm lúc này. Bạn có thể thêm sau ở phần sửa dáng nhé.</p>;
    }
    return this.props.children;
  }
}

const subscribe = () => () => {};

/** Client-only (a render error must not turn the server render into a 500) and crash-safe. */
export function PlacePickerBoundary({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? <Boundary>{children}</Boundary> : null;
}
