<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Flarum\User\User;

class CreateTourGuideStep
{
    public function __construct(public User $actor, public array $data)
    {
    }
}
