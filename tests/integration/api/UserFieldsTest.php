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

use PHPUnit\Framework\Attributes\Test;

/**
 * What a member's own record says about their tours, and who gets to see it.
 */
class UserFieldsTest extends TourGuideTestCase
{
    #[Test]
    public function member_sees_their_own_count_and_may_reset_it(): void
    {
        $this->send($this->request('POST', '/api/tour-guide/completions', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['tourKey' => 'welcome', 'outcome' => 'finished'],
        ]));

        $attributes = $this->userAttributes(self::MEMBER, self::MEMBER);

        $this->assertEquals(1, $attributes['tourGuideCompletionCount']);
        $this->assertTrue($attributes['canResetTourGuide']);
    }

    #[Test]
    public function a_member_learns_nothing_about_somebody_else(): void
    {
        $attributes = $this->userAttributes(self::ADMIN, self::MEMBER);

        $this->assertArrayNotHasKey('tourGuideCompletionCount', $attributes);
        $this->assertFalse($attributes['canResetTourGuide']);
    }

    #[Test]
    public function a_moderator_with_the_permission_may_reset_anybody(): void
    {
        $attributes = $this->userAttributes(self::MEMBER, self::ADMIN);

        $this->assertTrue($attributes['canResetTourGuide']);
        $this->assertArrayHasKey('tourGuideCompletionCount', $attributes);
    }

    /**
     * @return array<string, mixed>
     */
    protected function userAttributes(int $subject, int $actor): array
    {
        $response = $this->send($this->request('GET', "/api/users/$subject", ['authenticatedAs' => $actor]));

        return $this->json($response)['data']['attributes'] ?? [];
    }
}
