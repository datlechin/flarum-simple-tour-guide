<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Api;

use Flarum\Formatter\Formatter;
use Illuminate\Contracts\Cache\Repository;

/**
 * Turns a step's description into HTML using the forum's own formatter.
 *
 * The same one that renders posts, so a description supports exactly what a
 * post supports on this forum and nothing had to be invented: Markdown if
 * flarum/markdown is on, BBCode if bbcode is on, and neither if neither is.
 */
class StepRenderer
{
    /** A week. Entries are keyed by content, so nothing goes stale. */
    protected const TTL = 604800;

    public function __construct(
        protected Formatter $formatter,
        protected Repository $cache,
    ) {
    }

    public function render(string $text): string
    {
        if (trim($text) === '') {
            return '';
        }

        // Keyed by the text itself, so editing a step writes to a different key
        // and there is never anything to invalidate. Turning a formatting
        // extension on or off does change the output for unchanged text, and
        // that is what `php flarum cache:clear` is for, which you run after
        // toggling an extension anyway.
        return $this->cache->remember(
            'datlechin-simple-tour-guide.rendered.'.hash('xxh128', $text),
            self::TTL,
            fn () => $this->formatter->render($this->formatter->parse($text))
        );
    }
}
