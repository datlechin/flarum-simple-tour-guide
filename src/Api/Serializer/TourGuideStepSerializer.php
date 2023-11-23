<?php

namespace Datlechin\FlarumSimpleTourGuide\Api\Serializer;

use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Flarum\Api\Serializer\AbstractSerializer;
use InvalidArgumentException;

class TourGuideStepSerializer extends AbstractSerializer
{
    protected $type = 'tour-guide-steps';

    protected function getDefaultAttributes($tourGuideStep)
    {
        if (!($tourGuideStep instanceof TourGuideStep)) {
            throw new InvalidArgumentException(
                sprintf(
                    '%s can only serialize instances of %s',
                    $this::class,
                    TourGuideStep::class
                )
            );
        }

        $attributes = [
            'title' => $tourGuideStep->title,
            'description' => $tourGuideStep->description,
            'target' => $tourGuideStep->target,
        ];

        return $attributes;
    }
}
