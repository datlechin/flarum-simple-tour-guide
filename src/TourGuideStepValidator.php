<?php

namespace Datlechin\FlarumSimpleTourGuide;

use Flarum\Foundation\AbstractValidator;

class TourGuideStepValidator extends AbstractValidator
{
    protected $rules = [
        'title' => ['required', 'string'],
        'description' => ['required', 'string'],
        'target' => ['required', 'string', 'max:255', 'not_regex:/[\n\r]/'],
        'is_trigger_click' => ['required', 'boolean'],
    ];
}
