<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Access;

use Flarum\User\Access\AbstractPolicy;
use Flarum\User\User;

class UserPolicy extends AbstractPolicy
{
    /**
     * Members own their own tours: they mark one done when they reach the end,
     * and they may take it again. Doing that to somebody else is a moderator
     * action.
     *
     * Abstains rather than denying, so another extension is still free to
     * grant it.
     */
    public function resetTourGuide(User $actor, User $user): ?string
    {
        if ($actor->is($user) || $actor->hasPermission('resetTourGuide')) {
            return $this->allow();
        }

        return null;
    }
}
