import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import UserControls from 'flarum/forum/utils/UserControls';
import extractText from 'flarum/common/utils/extractText';
import type ItemList from 'flarum/common/utils/ItemList';
import type User from 'flarum/common/models/User';
import type Mithril from 'mithril';

import { resetTours } from './loadTours';

export default function addResetTourGuideControl(): void {
  extend(UserControls, 'moderationControls', (items: ItemList<Mithril.Children>, user: User) => {
    if (!user.canResetTourGuide()) return;

    items.add(
      'resetTourGuide',
      <Button icon="fas fa-rotate" onclick={() => resetTourGuide(user)}>
        {app.translator.trans('datlechin-simple-tour-guide.forum.user_controls.reset_tour_guide')}
      </Button>
    );
  });
}

function resetTourGuide(user: User): void {
  if (!confirm(extractText(app.translator.trans('datlechin-simple-tour-guide.forum.user_controls.reset_tour_guide_confirmation')))) return;

  resetTours(user.id()!).then(() => {
    app.alerts.show({ type: 'success' }, app.translator.trans('datlechin-simple-tour-guide.forum.user_controls.reset_tour_guide_done'));
  });
}
