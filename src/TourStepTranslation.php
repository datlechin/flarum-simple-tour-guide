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

use Carbon\Carbon;
use Flarum\Database\AbstractModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A step's wording in one language.
 *
 * @property int $id
 * @property int $step_id
 * @property string $locale
 * @property string $title
 * @property string $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read TourStep $step
 *
 * @method static Builder<static> query()
 */
class TourStepTranslation extends AbstractModel
{
    protected $table = 'tour_guide_step_translations';

    protected $fillable = ['step_id', 'locale', 'title', 'description'];

    public $timestamps = true;

    protected $casts = [
        'step_id' => 'int',
    ];

    /**
     * @return BelongsTo<TourStep, $this>
     */
    public function step(): BelongsTo
    {
        return $this->belongsTo(TourStep::class, 'step_id');
    }
}
