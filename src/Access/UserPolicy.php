<?php

namespace Datlechin\FlarumSimpleTourGuide\Access;

use Flarum\User\User;
use Flarum\User\Access\AbstractPolicy;

class UserPolicy extends AbstractPolicy
{
    public function resetTourGuide(User $actor, User $user)
    {
        if ($user->hasPermission('resetTourGuide')) {
            return $this->allow();
        }

        return $this->deny();
    }
}
