<?php

namespace Datlechin\FlarumSimpleTourGuide\Command;

use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Datlechin\FlarumSimpleTourGuide\TourGuideStepValidator;
use Illuminate\Support\Arr;

class EditTourGuideStepHandler
{
    public function __construct(protected TourGuideStepValidator $validator)
    {
    }

    public function handle(EditTourGuideStep $command): TourGuideStep
    {
        $data = $command->data;

        /** @var \Datlechin\FlarumSimpleTourGuide\TourGuideStep $tourGuideStep */
        $tourGuideStep = TourGuideStep::query()->findOrFail($command->id);

        $attributes = Arr::get($data, 'attributes', []);

        $tourGuideStep->fill($attributes);

        $this->validator->assertValid($tourGuideStep->getDirty());

        $tourGuideStep->save();

        return $tourGuideStep;
    }
}
