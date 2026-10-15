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

use Datlechin\FlarumSimpleTourGuide\Access\ScopeTourVisibility;
use Datlechin\FlarumSimpleTourGuide\Access\UserPolicy;
use Datlechin\FlarumSimpleTourGuide\Api\Resource\TourCompletionResource;
use Datlechin\FlarumSimpleTourGuide\Api\Resource\TourResource;
use Datlechin\FlarumSimpleTourGuide\Api\Resource\TourStepResource;
use Datlechin\FlarumSimpleTourGuide\Search\Filter\AvailableFilter;
use Datlechin\FlarumSimpleTourGuide\Search\TourSearcher;
use Flarum\Api\Context;
use Flarum\Api\Endpoint;
use Flarum\Api\Resource\UserResource;
use Flarum\Api\Schema;
use Flarum\Extend;
use Flarum\Search\Database\DatabaseSearchDriver;
use Flarum\User\User;
use Laminas\Diactoros\Response\EmptyResponse;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\ServiceProvider())
        ->register(TourGuideServiceProvider::class),

    new Extend\ApiResource(TourResource::class),
    new Extend\ApiResource(TourStepResource::class),
    new Extend\ApiResource(TourCompletionResource::class),

    (new Extend\ApiResource(UserResource::class))
        ->fields(fn () => [
            Schema\Boolean::make('canResetTourGuide')
                ->get(fn (User $user, Context $context) => $context->getActor()->can('resetTourGuide', $user)),
        ])
        ->endpoints(fn () => [
            Endpoint\Endpoint::make('tourGuideCompletions.delete')
                ->route('DELETE', '/{id}/tour-guide-completions')
                ->can('resetTourGuide')
                ->action(fn (Context $context) => TourCompletion::query()->where('user_id', $context->model->id)->delete())
                ->response(fn () => new EmptyResponse(204)),
        ]),

    // Flarum models ignore Eloquent's $attributes, so a new row only reports these defaults through here.
    (new Extend\Model(Tour::class))
        ->default('is_enabled', true)
        ->default('start_mode', Tour::START_AUTO)
        ->default('devices', Tour::DEVICES_ANY),

    (new Extend\Model(TourStep::class))
        ->default('placement', TourStep::PLACEMENT_AUTO)
        ->default('devices', Tour::DEVICES_ANY)
        ->default('is_enabled', true)
        ->default('clicks_target', false)
        ->default('advance_on_click', false),

    (new Extend\ModelVisibility(Tour::class))
        ->scope(ScopeTourVisibility::class),

    (new Extend\SearchDriver(DatabaseSearchDriver::class))
        ->addSearcher(Tour::class, TourSearcher::class)
        ->addFilter(TourSearcher::class, AvailableFilter::class),

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
