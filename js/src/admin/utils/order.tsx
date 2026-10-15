import app from 'flarum/admin/app';
import Button from 'flarum/common/components/Button';
import type Model from 'flarum/common/Model';
import type Mithril from 'mithril';

interface Positioned extends Model {
  position(): number;
}

type Save = (ids: string[]) => Promise<unknown>;

export function applyOrder(models: Positioned[], ids: string[], save: Save): void {
  const before = models.map((model) => [model, model.position()] as const);

  ids.forEach((id, position) => models.find((model) => model.id() === id)?.pushAttributes({ position }));

  save(ids).catch(() => {
    before.forEach(([model, position]) => model.pushAttributes({ position }));
    m.redraw();
  });

  m.redraw();
}

// A keyboard cannot drag, so each row's menu can move it too.
export function moveButton(models: Positioned[], model: Positioned, delta: -1 | 1, save: Save): Mithril.Children {
  const ids = models.map((other) => other.id()!);
  const from = ids.indexOf(model.id()!);
  const to = from + delta;

  return (
    <Button
      icon={delta < 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'}
      disabled={to < 0 || to >= ids.length}
      onclick={() => {
        ids.splice(to, 0, ...ids.splice(from, 1));
        applyOrder(models, ids, save);
      }}
    >
      {delta < 0
        ? app.translator.trans('datlechin-simple-tour-guide.admin.move_up')
        : app.translator.trans('datlechin-simple-tour-guide.admin.move_down')}
    </Button>
  );
}
