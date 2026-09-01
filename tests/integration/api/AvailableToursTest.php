<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Tests\Integration\Api;

use Carbon\Carbon;
use Flarum\Group\Group;
use Flarum\User\User;
use PHPUnit\Framework\Attributes\Test;

/**
 * What the forum is told, which is deliberately much less than the admin area
 * can see.
 */
class AvailableToursTest extends TourGuideTestCase
{
    #[Test]
    public function member_is_offered_the_tour(): void
    {
        $tours = $this->availableTo(self::MEMBER);

        $this->assertArrayHasKey('welcome', $tours);
        $this->assertEquals('index', $tours['welcome']['route']);
        $this->assertCount(3, $tours['welcome']['steps']);
        $this->assertFalse($tours['welcome']['completed']);
    }

    #[Test]
    public function guest_is_offered_nothing(): void
    {
        $response = $this->send($this->request('GET', '/api/tour-guide/available'));

        $this->assertContains($response->getStatusCode(), [401, 403]);
    }

    #[Test]
    public function audience_rules_never_reach_the_browser(): void
    {
        $tours = $this->availableTo(self::MEMBER);

        $this->assertArrayNotHasKey('groupIds', $tours['welcome']);
        $this->assertArrayNotHasKey('maxAccountAgeDays', $tours['welcome']);
    }

    #[Test]
    public function disabled_tour_is_not_offered(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['is_enabled' => 0]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
    }

    #[Test]
    public function disabled_steps_are_left_out(): void
    {
        $this->database()->table('tour_guide_steps')->where('id', 2)->update(['is_enabled' => 0]);

        $this->assertCount(2, $this->availableTo(self::MEMBER)['welcome']['steps']);
    }

    #[Test]
    public function a_tour_whose_every_step_is_off_is_not_a_tour(): void
    {
        $this->database()->table('tour_guide_steps')->update(['is_enabled' => 0]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
    }

    #[Test]
    public function admin_may_preview_a_disabled_tour(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['is_enabled' => 0]);

        $tours = $this->availableTo(self::ADMIN, ['preview' => 'welcome']);

        $this->assertArrayHasKey('welcome', $tours);
        $this->assertTrue($tours['welcome']['preview']);
    }

    #[Test]
    public function member_may_not_preview_a_disabled_tour(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['is_enabled' => 0]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER, ['preview' => 'welcome']));
    }

    #[Test]
    public function tour_aimed_at_a_group_skips_everybody_else(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)
            ->update(['group_ids' => json_encode([Group::ADMINISTRATOR_ID])]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
        $this->assertArrayHasKey('welcome', $this->availableTo(self::ADMIN));
    }

    #[Test]
    public function tour_for_new_accounts_skips_an_old_one(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['max_account_age_days' => 7]);

        $this->assertArrayHasKey('welcome', $this->availableTo(self::MEMBER));

        $this->database()->table('users')->where('id', self::MEMBER)
            ->update(['joined_at' => Carbon::now()->subDays(30)]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
    }

    #[Test]
    public function a_description_is_formatted_the_way_a_post_would_be(): void
    {
        // With flarum/markdown on, a description gets Markdown, because the
        // description goes through the forum's own formatter rather than
        // anything this extension invented.
        $this->extension('flarum-markdown', 'datlechin-simple-tour-guide');

        $this->database()->table('tour_guide_steps')->where('id', 1)
            ->update(['description' => 'Some **bold** words.']);

        $steps = $this->availableTo(self::MEMBER)['welcome']['steps'];

        $this->assertStringContainsString('<strong>bold</strong>', $steps[0]['description']);
    }

    #[Test]
    public function a_description_gets_no_markdown_when_the_forum_has_none(): void
    {
        // The flip side, and the reason this is the right way round: the tour
        // follows the forum's formatting rather than imposing its own.
        $this->database()->table('tour_guide_steps')->where('id', 1)
            ->update(['description' => 'Some **bold** words.']);

        $steps = $this->availableTo(self::MEMBER)['welcome']['steps'];

        $this->assertStringNotContainsString('<strong>', $steps[0]['description']);
    }

    #[Test]
    public function member_reads_a_step_in_their_own_language(): void
    {
        $this->database()->table('tour_guide_step_translations')->insert([
            'step_id' => 1,
            'locale' => 'xx',
            'title' => 'Translated title',
            'description' => 'Translated body.',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Without that locale installed the forum falls back to what the admin
        // originally wrote, which is the point of keeping it on the step.
        $steps = $this->availableTo(self::MEMBER)['welcome']['steps'];

        $this->assertEquals('Welcome', $steps[0]['title']);
    }

    #[Test]
    public function steps_come_back_in_the_order_they_run(): void
    {
        $titles = array_column($this->availableTo(self::MEMBER)['welcome']['steps'], 'title');

        $this->assertEquals(['Welcome', 'The header', 'Home'], $titles);
    }
}
