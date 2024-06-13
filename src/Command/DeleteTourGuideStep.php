<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Flarum\User\User;

class DeleteTourGuideStep
{
    public function __construct(public $id, public User $actor, public array $data = [])
    {
    }
}
