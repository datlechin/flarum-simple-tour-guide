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
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One stop on a tour: a title and a body, optionally anchored to an element.
 *
 * @property int $id
 * @property int $tour_id
 * @property string $title
 * @property string $description
 * @property string|null $target
 * @property string $placement
 * @property string $devices
 * @property bool $is_enabled
 * @property bool $clicks_target
 * @property bool $advance_on_click
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Tour $tour
 * @property-read \Illuminate\Database\Eloquent\Collection<int, TourStepTranslation> $translations
 *
 * @method static Builder<static> query()
 */
class TourStep extends AbstractModel
{
    public const PLACEMENT_AUTO = 'auto';

    protected $table = 'tour_guide_steps';

    /**
     * The table has carried these columns since it was created, but the base
     * model leaves timestamps off, so until now nothing ever wrote them.
     */
    public $timestamps = true;

    /** Mirrors the column defaults; see the note on Tour. */
    protected $attributes = [
        'placement' => self::PLACEMENT_AUTO,
        'devices' => 'any',
        'is_enabled' => true,
        'clicks_target' => false,
        'advance_on_click' => false,
        'position' => 0,
    ];

    protected $casts = [
        'tour_id' => 'int',
        'is_enabled' => 'bool',
        'clicks_target' => 'bool',
        'advance_on_click' => 'bool',
        'position' => 'int',
    ];

    /**
     * @return BelongsTo<Tour, $this>
     */
    public function tour(): BelongsTo
    {
        return $this->belongsTo(Tour::class, 'tour_id');
    }

    /**
     * @return HasMany<TourStepTranslation, $this>
     */
    public function translations(): HasMany
    {
        return $this->hasMany(TourStepTranslation::class, 'step_id');
    }

    /**
     * The wording to show somebody reading in `$locale`.
     *
     * Falls back to the step's own title and description, which is what the
     * admin typed when they wrote the step, so an untranslated step still
     * reads rather than coming out blank.
     *
     * @return array{title: string, description: string}
     */
    public function contentFor(string $locale): array
    {
        $translation = $this->translations->first(fn (TourStepTranslation $t) => $t->locale === $locale)
            // A member reading pt-BR should get a pt translation before falling
            // all the way back to the original.
            ?? $this->translations->first(fn (TourStepTranslation $t) => str_starts_with($locale, $t->locale.'-'));

        return [
            'title' => $translation->title ?? $this->title,
            'description' => $translation->description ?? $this->description,
        ];
    }

    public static function placements(): array
    {
        return [self::PLACEMENT_AUTO, 'top', 'bottom', 'left', 'right'];
    }
}
