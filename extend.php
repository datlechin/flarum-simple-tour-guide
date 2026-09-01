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

use Datlechin\FlarumSimpleTourGuide\Access\UserPolicy;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\DuplicateTourController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\DuplicateTourStepController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\ExportTourController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\ImportTourController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\OrderToursController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\OrderTourStepsController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\RecordTourCompletionController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\ResetTourCompletionsController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\ShowAvailableToursController;
use Datlechin\FlarumSimpleTourGuide\Api\Controller\ShowTourStatsController;
use Datlechin\FlarumSimpleTourGuide\Api\Resource\TourResource;
use Datlechin\FlarumSimpleTourGuide\Api\Resource\TourStepResource;
use Datlechin\FlarumSimpleTourGuide\Api\UserResourceFields;
use Flarum\Api\Resource\UserResource;
use Flarum\Extend;
use Flarum\User\User;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    new Extend\Locales(__DIR__.'/locale'),

    new Extend\ApiResource(TourResource::class),
    new Extend\ApiResource(TourStepResource::class),

    (new Extend\ApiResource(UserResource::class))
        ->fields(UserResourceFields::class),

    (new Extend\Routes('api'))
        // What the forum runs: only this member's tours, only in their
        // language. Deliberately not the admin resource, which would have to
        // hand out audience rules and every translation to answer the same
        // question.
        ->get('/tour-guide/available', 'tour-guide.available', ShowAvailableToursController::class)
        ->post('/tour-guide/completions', 'tour-guide.completions.record', RecordTourCompletionController::class)
        ->post('/tour-guide/completions/reset', 'tour-guide.completions.reset', ResetTourCompletionsController::class)

        // Ordering is one decision about a whole list, not an edit to each row
        // in it, so it is one request rather than one per moved row.
        ->post('/tour-guide-tours/order', 'tour-guide-tours.order', OrderToursController::class)
        ->post('/tour-guide-tours/{id}/steps/order', 'tour-guide-tours.steps.order', OrderTourStepsController::class)

        ->post('/tour-guide-tours/{id}/duplicate', 'tour-guide-tours.duplicate', DuplicateTourController::class)
        ->post('/tour-guide-steps/{id}/duplicate', 'tour-guide-steps.duplicate', DuplicateTourStepController::class)

        ->get('/tour-guide-tours/{id}/stats', 'tour-guide-tours.stats', ShowTourStatsController::class)
        ->get('/tour-guide-tours/{id}/export', 'tour-guide-tours.export', ExportTourController::class)
        ->post('/tour-guide-tours/import', 'tour-guide-tours.import', ImportTourController::class),

    (new Extend\Policy())
        ->modelPolicy(User::class, UserPolicy::class),

    (new Extend\Settings())
        ->default('datlechin-simple-tour-guide.show_progress', true)
        ->default('datlechin-simple-tour-guide.allow_close', true)
        ->default('datlechin-simple-tour-guide.show_in_settings', true)
        ->serializeToForum('datlechin-simple-tour-guide.showProgress', 'datlechin-simple-tour-guide.show_progress', 'boolval')
        ->serializeToForum('datlechin-simple-tour-guide.allowClose', 'datlechin-simple-tour-guide.allow_close', 'boolval')
        ->serializeToForum('datlechin-simple-tour-guide.showInSettings', 'datlechin-simple-tour-guide.show_in_settings', 'boolval'),
];
