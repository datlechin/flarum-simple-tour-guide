import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import Button from 'flarum/common/components/Button';
import UserControls from 'flarum/forum/utils/UserControls';
import extractText from 'flarum/common/utils/extractText';
import type ItemList from 'flarum/common/utils/ItemList';
import type User from 'flarum/common/models/User';
import type Mithril from 'mithril';

import { resetTours } from './loadTours';

/**
 * Offer to send a member through their tours again, to whoever is allowed to:
 * a moderator with the permission, or the member themselves.
 */
export default function addResetTourGuideControl(): void {
  extend(UserControls, 'moderationControls', (items: ItemList<Mithril.Children>, user: User) => {
    // The count only reaches people who may act on it, so an absent one means
    // either "not allowed to know" or "has taken no tours". Neither is
    // something to offer a reset for.
    if (!user.canResetTourGuide() || !user.tourGuideCompletionCount()) return;

    items.add(
      'resetTourGuide',
      <Button icon="fas fa-rotate" onclick={() => resetTourGuide(user)}>
        {app.translator.trans('datlechin-simple-tour-guide.forum.user_controls.reset_tour_guide')}
      </Button>
    );
  });
}

function resetTourGuide(user: User): void {
  const confirmation = extractText(app.translator.trans('datlechin-simple-tour-guide.forum.user_controls.reset_tour_guide_confirmation'));

  if (!confirm(confirmation)) return;

  resetTours(user.id()!).then(() => {
    user.pushAttributes({ tourGuideCompletionCount: 0 });
    m.redraw();
  });
}
