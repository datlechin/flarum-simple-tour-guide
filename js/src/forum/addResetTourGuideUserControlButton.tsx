import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import extractText from 'flarum/common/utils/extractText';
import UserControls from 'flarum/forum/utils/UserControls';
import ItemList from 'flarum/common/utils/ItemList';
import User from 'flarum/common/models/User';
import Button from 'flarum/common/components/Button';

export default function () {
  // @ts-ignore
  extend(UserControls, 'userControls', function (items: ItemList<import('mithril').Children>, user: User) {
    const actor = app.session.user;

    // @ts-ignore
    if (!actor.canResetTourGuide() || !user.attribute('tourGuideDismissedAt')) {
      return;
    }

    const resetTourGuide = (user: User) => {
      if (confirm(extractText(app.translator.trans('datlechin-simple-tour-guide.forum.user_controls.reset_tour_guide_confirmation')))) {
        user.save({ tourGuideDismissedAt: null }).then(() => m.redraw());
      }
    };

    items.add(
      'reset-tour-guide',
      <Button icon="fas fa-sync" onclick={() => resetTourGuide(user)}>
        {app.translator.trans('datlechin-simple-tour-guide.forum.user_controls.reset_tour_guide')}
      </Button>
    );
  });
}
