<?php

namespace Datlechin\FlarumSimpleTourGuide\Listener;

use Flarum\User\Event\Saving;
use Illuminate\Support\Arr;

class SaveTourGuideDismissedAtToDatabase
{
    public function handle(Saving $event): void
    {
        $attributes = Arr::get($event->data, 'attributes', []);

        if (! array_key_exists('tourGuideDismissedAt', $attributes)) {
            return;
        }

        $user = $event->user;
        $actor = $event->actor;

        $actor->assertCan('resetTourGuide', $user);

        $user->tour_guide_dismissed_at = null;
        $user->save();
    }
}
