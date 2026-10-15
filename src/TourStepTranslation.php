<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide;

use Flarum\Database\AbstractModel;
use Flarum\Formatter\Formattable;
use Flarum\Formatter\HasFormattedContent;

/**
 * @property int $id
 * @property int $step_id
 * @property string $locale
 * @property string $title
 * @property string|null $content
 */
class TourStepTranslation extends AbstractModel implements Formattable
{
    use HasFormattedContent;

    protected $table = 'tour_guide_step_translations';

    public $timestamps = true;

    protected $casts = [
        'step_id' => 'int',
    ];
}
