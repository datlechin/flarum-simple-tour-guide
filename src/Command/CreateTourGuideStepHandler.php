<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Datlechin\FlarumSimpleTourGuide\TourGuideStepValidator;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Arr;

class CreateTourGuideStepHandler
{
    protected $validator;

    protected $events;

    public function __construct(TourGuideStepValidator $validator, Dispatcher $events)
    {
        $this->validator = $validator;
        $this->events = $events;
    }

    public function handle(CreateTourGuideStep $command)
    {
        $data = $command->data;

        $tourGuideStep = new TourGuideStep([
            'title' => Arr::get($data, 'attributes.title'),
            'description' => Arr::get($data, 'attributes.description'),
            'target' => Arr::get($data, 'attributes.target'),
        ]);

        $this->validator->assertValid($tourGuideStep->getAttributes());

        $tourGuideStep->save();

        return $tourGuideStep;
    }
}
