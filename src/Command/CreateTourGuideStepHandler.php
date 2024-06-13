<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Datlechin\FlarumSimpleTourGuide\TourGuideStepValidator;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Arr;

class CreateTourGuideStepHandler
{
    public function __construct(
        protected TourGuideStepValidator $validator,
        protected Dispatcher $events,
    ) {
    }

    public function handle(CreateTourGuideStep $command): TourGuideStep
    {
        $data = $command->data;

        $tourGuideStep = new TourGuideStep([
            'title' => Arr::get($data, 'attributes.title'),
            'description' => Arr::get($data, 'attributes.description'),
            'target' => Arr::get($data, 'attributes.target'),
            'is_trigger_click' => Arr::get($data, 'attributes.is_trigger_click'),
        ]);

        $this->validator->assertValid($tourGuideStep->getAttributes());

        $tourGuideStep->save();

        return $tourGuideStep;
    }
}
