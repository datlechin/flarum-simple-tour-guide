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

use Flarum\Formatter\Formatter;
use Flarum\Foundation\AbstractServiceProvider;

class TourGuideServiceProvider extends AbstractServiceProvider
{
    public function boot(Formatter $formatter): void
    {
        TourStep::setFormatter($formatter);
        TourStepTranslation::setFormatter($formatter);
    }
}
