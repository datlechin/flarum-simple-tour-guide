<?php

namespace Datlechin\FlarumSimpleTourGuide\Api\Serializer;

use Datlechin\FlarumSimpleTourGuide\TourGuideStep;
use Flarum\Api\Serializer\AbstractSerializer;
use InvalidArgumentException;

class TourGuideStepSerializer extends AbstractSerializer
{
    protected $type = 'tour-guide-steps';

    protected function getDefaultAttributes($model)
    {
        if (! ($model instanceof TourGuideStep)) {
            throw new InvalidArgumentException(
                sprintf(
                    '%s can only serialize instances of %s',
                    $this::class,
                    TourGuideStep::class,
                ),
            );
        }

        return [
            'title' => $model->title,
            'description' => $model->description,
            'target' => $model->target,
            'isTriggerClick' => $model->is_trigger_click,
        ];
    }
}
