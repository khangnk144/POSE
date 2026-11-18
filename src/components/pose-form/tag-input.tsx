'use client';

import { useId, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const MAX_TAGS = 20;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

/**
 * Free-text tags. Enter or comma adds one; tapping a suggestion (existing tags from other
 * poses, matching what is typed) adds it too.
 */
export function TagInput({
  tags,
  onChange,
  suggestions,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [text, setText] = useState('');
  const id = useId();

  const add = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').slice(0, 40);
    if (!tag || tags.length >= MAX_TAGS || tags.some((t) => norm(t) === norm(tag))) return;
    onChange([...tags, tag]);
  };
  const commit = () => {
    add(text);
    setText('');
  };

  const shown = useMemo(() => {
    const q = norm(text.trim());
    const have = new Set(tags.map(norm));
    return suggestions.filter((s) => !have.has(norm(s)) && norm(s).includes(q)).slice(0, 8);
  }, [suggestions, tags, text]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-text">Tag</label>
      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Tag đã chọn">
          {tags.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                aria-label={`Bỏ tag ${t}`}
                className="inline-flex h-9 items-center gap-1 rounded-full border-[1.5px] border-primary bg-primary-soft px-3 text-[13px] font-medium text-on-primary-soft"
              >
                {t}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={id}
        value={text}
        maxLength={40}
        placeholder="Gõ tag rồi nhấn Enter (vd: ngược sáng)"
        enterKeyHint="done"
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(',')) {
            add(v.slice(0, -1));
            setText('');
          } else setText(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        className={cn(
          'h-12 w-full rounded-sm border border-border-strong bg-surface px-3.5 text-text placeholder:text-text-3',
        )}
      />
      {shown.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2" aria-label="Gợi ý tag">
          <span className="text-xs text-text-2">Gợi ý:</span>
          {shown.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex min-h-11 items-center"
            >
              <span className="inline-flex h-9 items-center rounded-full border border-border-strong bg-surface px-3 text-[13px] text-text">
                + {s}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
