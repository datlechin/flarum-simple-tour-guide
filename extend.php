<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide;

use Datlechin\FlarumSimpleTourGuide\Api\Controller\CreateTourGuideStepController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\DeleteTourGuideStepController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\DismissTourGuideController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\ListTourGuideStepController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\UpdateTourGuideStepController;
use Flarum\Api\Serializer\UserSerializer;
use Flarum\User\Event\Saving;
use Flarum\User\User;
use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/less/admin.less'),

    new Extend\Locales(__DIR__ . '/locale'),

    (new Extend\ApiSerializer(UserSerializer::class))
        ->attribute(
            'tourGuideDismissedAt',
            fn (UserSerializer $serializer, User $user, array $attributes) => $user->tour_guide_dismissed_at,
        )
        ->attribute(
            'canResetTourGuide',
            fn (UserSerializer $serializer, User $user) => $serializer->getActor()->can('resetTourGuide', $user),
        ),

    (new Extend\Routes('api'))
        ->get('/tour-guide-steps', 'tour-guide-steps.index', ListTourGuideStepController::class)
        ->post('/tour-guide-steps', 'tour-guide-steps.create', CreateTourGuideStepController::class)
        ->delete('/tour-guide-steps/{id}', 'tour-guide-steps.delete', DeleteTourGuideStepController::class)
        ->patch('/tour-guide-steps/{id}', 'tour-guide-steps.update', UpdateTourGuideStepController::class)
        ->post('/simple-tour-guide/dismiss', 'simple-tour-guide.dismiss', DismissTourGuideController::class),

    (new Extend\Settings())
        ->serializeToForum('datlechin-simple-tour-guide.showProgress', 'datlechin-simple-tour-guide.show_progress', 'boolval')
        ->serializeToForum('datlechin-simple-tour-guide.allowDismiss', 'datlechin-simple-tour-guide.allow_dismiss', 'boolval')
        ->serializeToForum('datlechin-simple-tour-guide.skipNullElements', 'datlechin-simple-tour-guide.skip_null_elements', 'boolval')
        ->serializeToForum('datlechin-simple-tour-guide.steps', 'datlechin-simple-tour-guide.steps'),

    (new Extend\Event())
        ->listen(Saving::class, Listener\SaveTourGuideDismissedAtToDatabase::class),

    (new Extend\Policy())
        ->modelPolicy(User::class, Access\UserPolicy::class),
];
