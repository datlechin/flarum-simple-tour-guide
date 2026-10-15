import Component from 'flarum/common/Component';
import type { ComponentAttrs } from 'flarum/common/Component';
import type Mithril from 'mithril';

type Sortable = typeof import('flarum/admin/utils/loadSortable')['default'];

export interface SortableListAttrs extends ComponentAttrs {
  className?: string;
  handle: string;
  onsort: (ids: string[]) => void;
}

// Rows need a data-id.
export default class SortableList<CustomAttrs extends SortableListAttrs = SortableListAttrs> extends Component<CustomAttrs> {
  private sortable: Sortable | null = null;
  private instance: ReturnType<Sortable['create']> | null = null;
  private list: HTMLElement | null = null;

  // Sortable moves rows behind Mithril's back, so after a drag the list is rebuilt instead of diffed against moved nodes.
  private generation = 0;

  oninit(vnode: Mithril.Vnode<CustomAttrs, this>) {
    super.oninit(vnode);

    import('flarum/admin/utils/loadSortable').then(({ default: sortable }) => {
      this.sortable = sortable;
      this.attach();
    });
  }

  view(vnode: Mithril.Vnode<CustomAttrs, this>): Mithril.Children {
    return [
      <ol
        key={this.generation}
        className={this.attrs.className}
        oncreate={(list: Mithril.VnodeDOM) => {
          this.list = list.dom as HTMLElement;
          this.attach();
        }}
      >
        {vnode.children}
      </ol>,
    ];
  }

  onremove(vnode: Mithril.VnodeDOM<CustomAttrs, this>): void {
    super.onremove(vnode);

    this.instance?.destroy();
  }

  // Runs from both the import and oncreate, whichever is last.
  private attach(): void {
    if (!this.sortable || !this.list?.isConnected) return;

    this.instance?.destroy();
    this.instance = this.sortable.create(this.list, {
      handle: this.attrs.handle,
      animation: 150,
      delay: 50,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      dragClass: 'sortable-dragging',
      ghostClass: 'sortable-placeholder',
      onSort: () => {
        this.attrs.onsort(this.instance!.toArray());
        this.generation++;
        m.redraw();
      },
    });
  }
}
