<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Flarum\User\User;

class EditTourGuideStep
{
    public function __construct(public $id, public User $actor, public array $data)
    {
    }
}
