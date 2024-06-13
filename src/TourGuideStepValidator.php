<?php

namespace Datlechin\FlarumSimpleTourGuide;

use Flarum\Foundation\AbstractValidator;

class TourGuideStepValidator extends AbstractValidator
{
    protected $rules = [
        'title' => ['required', 'string'],
        'description' => ['required', 'string'],
        'target' => ['required', 'string', 'regex:/^[.#]?[a-zA-Z]+[\w-]*$/'],
        'is_trigger_click' => ['required', 'boolean'],
    ];
}
