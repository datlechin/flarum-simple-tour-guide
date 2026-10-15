<?php

/*
 * This file is part of datlechin/flarum-simple-tour-guide.
 *
 * Copyright (c) 2023 Ngo Quoc Dat.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Datlechin\FlarumSimpleTourGuide\Tests\integration\api;

use Carbon\Carbon;
use Flarum\Group\Group;
use PHPUnit\Framework\Attributes\Test;

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
        $response = $this->send($this->request('GET', '/api/tour-guide-tours'));

        $this->assertEquals(401, $response->getStatusCode());
    }

    #[Test]
    public function audience_rules_and_raw_content_never_reach_a_member(): void
    {
        $tour = $this->availableTo(self::MEMBER)['welcome'];

        $this->assertArrayNotHasKey('isEnabled', $tour);
        $this->assertArrayNotHasKey('maxAccountAgeDays', $tour);
        $this->assertArrayNotHasKey('position', $tour);
        $this->assertNotContains('groups', $tour['relationships']);
        $this->assertNotContains('steps', $tour['relationships']);

        foreach (['title', 'description', 'translations', 'isEnabled', 'position'] as $attribute) {
            $this->assertArrayNotHasKey($attribute, $tour['steps'][0]);
        }
    }

    #[Test]
    public function disabled_tour_is_not_offered(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['is_enabled' => 0]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
        $this->assertArrayNotHasKey('welcome', $this->tours(self::MEMBER));
    }

    #[Test]
    public function disabled_steps_are_left_out(): void
    {
        $this->database()->table('tour_guide_steps')->where('id', 2)->update(['is_enabled' => 0]);

        $this->assertCount(2, $this->availableTo(self::MEMBER)['welcome']['steps']);
    }

    #[Test]
    public function a_tour_whose_every_step_is_off_is_not_offered(): void
    {
        $this->database()->table('tour_guide_steps')->update(['is_enabled' => 0]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
    }

    #[Test]
    public function admin_is_offered_only_what_a_member_would_be(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['is_enabled' => 0]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::ADMIN));
    }

    #[Test]
    public function admin_may_preview_a_disabled_tour(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['is_enabled' => 0]);

        $this->assertCount(3, $this->tours(self::ADMIN)['welcome']['steps']);
    }

    #[Test]
    public function tour_aimed_at_a_group_skips_everybody_else(): void
    {
        $this->database()->table('tour_guide_tour_group')->insert(['tour_id' => 1, 'group_id' => Group::ADMINISTRATOR_ID]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
        $this->assertArrayHasKey('welcome', $this->availableTo(self::ADMIN));
    }

    #[Test]
    public function tour_aimed_at_members_reaches_confirmed_accounts_only(): void
    {
        $this->database()->table('tour_guide_tour_group')->insert(['tour_id' => 1, 'group_id' => Group::MEMBER_ID]);

        $this->assertArrayHasKey('welcome', $this->availableTo(self::MEMBER));

        $this->database()->table('users')->where('id', self::MEMBER)->update(['is_email_confirmed' => 0]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
    }

    #[Test]
    public function tour_for_new_accounts_skips_an_old_one(): void
    {
        $this->database()->table('tour_guide_tours')->where('id', 1)->update(['max_account_age_days' => 7]);

        $this->assertArrayHasKey('welcome', $this->availableTo(self::MEMBER));

        $this->database()->table('users')->where('id', self::MEMBER)->update(['joined_at' => Carbon::now()->subDays(30)]);

        $this->assertArrayNotHasKey('welcome', $this->availableTo(self::MEMBER));
    }

    #[Test]
    public function a_description_is_formatted_the_way_a_post_would_be(): void
    {
        $this->extension('flarum-markdown', 'datlechin-simple-tour-guide');

        $this->patchStep(1, ['description' => 'Some **bold** words.']);

        $this->assertStringContainsString('<strong>bold</strong>', $this->availableTo(self::MEMBER)['welcome']['steps'][0]['descriptionHtml']);
    }

    #[Test]
    public function a_description_gets_no_markdown_when_the_forum_has_none(): void
    {
        $this->patchStep(1, ['description' => 'Some **bold** words.']);

        $this->assertStringNotContainsString('<strong>', $this->availableTo(self::MEMBER)['welcome']['steps'][0]['descriptionHtml']);
    }

    #[Test]
    public function member_reads_a_step_in_their_own_language(): void
    {
        $this->database()->table('tour_guide_step_translations')->insert([
            ['step_id' => 1, 'locale' => 'en', 'title' => 'Translated', 'content' => '<t>Translated body.</t>', 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
            ['step_id' => 2, 'locale' => 'en', 'title' => 'Title only', 'content' => null, 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],
        ]);

        $steps = $this->availableTo(self::MEMBER)['welcome']['steps'];

        $this->assertEquals('Translated', $steps[0]['localizedTitle']);
        $this->assertStringContainsString('Translated body.', $steps[0]['descriptionHtml']);
        $this->assertEquals('Title only', $steps[1]['localizedTitle']);
        $this->assertStringContainsString('Body of The header.', $steps[1]['descriptionHtml']);
    }

    #[Test]
    public function steps_come_back_in_the_order_they_run(): void
    {
        $this->database()->table('tour_guide_steps')->where('id', 1)->update(['position' => 2]);
        $this->database()->table('tour_guide_steps')->where('id', 2)->update(['position' => 0]);
        $this->database()->table('tour_guide_steps')->where('id', 3)->update(['position' => 1]);

        $titles = array_column($this->availableTo(self::MEMBER)['welcome']['steps'], 'localizedTitle');

        $this->assertEquals(['The header', 'Home', 'Welcome'], $titles);
    }

    #[Test]
    public function a_finished_tour_says_so(): void
    {
        $this->record(self::MEMBER, 'finished');

        $this->assertTrue($this->availableTo(self::MEMBER)['welcome']['completed']);
        $this->assertFalse($this->availableTo(self::ADMIN)['welcome']['completed']);
    }
}
