import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ListRow, type ListRowProps } from './ListRow';

/**
 * The row rendered one level down, without a DOM: `forwardRef` keeps the component's own render
 * function, and what it returns is the anchor, button or div with its props.
 */
function rendered(props: ListRowProps): ReactElement<Record<string, unknown>> {
  const render = (ListRow as unknown as { render: (p: ListRowProps, ref: null) => ReactElement })
    .render;
  return render(props, null) as ReactElement<Record<string, unknown>>;
}

describe('ListRow', () => {
  it('keeps the click handler on a link row', () => {
    // A link out of the Mini App needs its onClick (externalLinkProps) on the anchor itself;
    // dropping it left the profile's «Подписка» row a dead link inside Telegram.
    const onClick = vi.fn();
    const el = rendered({ title: 'x', href: 'https://example.com/pay', onClick });
    expect(el.type).toBe('a');
    expect(el.props.href).toBe('https://example.com/pay');
    expect(el.props.onClick).toBe(onClick);
  });

  it('is a button without a link and a plain row without either', () => {
    expect(rendered({ title: 'x', onClick: vi.fn() }).type).toBe('button');
    expect(rendered({ title: 'x' }).type).toBe('div');
  });
});
