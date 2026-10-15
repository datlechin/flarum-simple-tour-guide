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
use Flarum\User\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $tour_id
 * @property string $title
 * @property string|null $content
 * @property string|null $target
 * @property string $placement
 * @property string $devices
 * @property bool $is_enabled
 * @property bool $clicks_target
 * @property bool $advance_on_click
 * @property int $position
 * @property-read Collection<int, TourStepTranslation> $translations
 */
class TourStep extends AbstractModel implements Formattable
{
    use HasFormattedContent;
    use Orderable;

    public const PLACEMENT_AUTO = 'auto';

    protected $table = 'tour_guide_steps';

    public $timestamps = true;

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

    public function translationFor(string $locale): ?TourStepTranslation
    {
        return $this->translations->firstWhere('locale', $locale)
            // pt-BR falls back to pt before the untranslated original.
            ?? $this->translations->first(fn (TourStepTranslation $translation) => str_starts_with($locale, $translation->locale.'-'));
    }

    /**
     * @return array<string, array{title: string, description: string}>
     */
    public function translationMap(): array
    {
        return $this->translations
            ->sortBy('locale')
            ->mapWithKeys(fn (TourStepTranslation $translation) => [
                $translation->locale => ['title' => $translation->title, 'description' => $translation->content ?? ''],
            ])
            ->all();
    }

    public function saveTranslation(string $locale, string $title, string $description, ?User $actor = null): void
    {
        $translation = $this->translations->firstWhere('locale', $locale) ?? new TourStepTranslation();
        $translation->step_id = $this->id;
        $translation->locale = $locale;
        $translation->title = $title;
        $translation->setContentAttribute($description, $actor);
        $translation->save();
    }

    public static function placements(): array
    {
        return [self::PLACEMENT_AUTO, 'top', 'bottom', 'left', 'right'];
    }
}
