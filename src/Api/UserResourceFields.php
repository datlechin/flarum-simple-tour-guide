<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Api;

use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Flarum\Api\Context;
use Flarum\Api\Schema;
use Flarum\User\User;

class UserResourceFields
{
    /**
     * @return array<\Tobyz\JsonApiServer\Schema\Field\Field>
     */
    public function __invoke(): array
    {
        $canReset = fn (User $user, Context $context) => $context->getActor()->can('resetTourGuide', $user);

        return [
            Schema\Boolean::make('canResetTourGuide')
                ->get($canReset),

            // How many tours this member has been through. Enough for the
            // profile control to know whether offering a reset means anything,
            // and it says nothing a moderator could not already work out.
            Schema\Integer::make('tourGuideCompletionCount')
                ->visible($canReset)
                ->get(fn (User $user) => TourCompletion::query()->where('user_id', $user->id)->count()),
        ];
    }
}
