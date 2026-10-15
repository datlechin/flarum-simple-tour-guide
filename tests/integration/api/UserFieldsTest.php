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

class UserFieldsTest extends TourGuideTestCase
{
    #[Test]
    public function member_may_reset_their_own_tours(): void
    {
        $this->assertTrue($this->userAttributes(self::MEMBER, self::MEMBER)['canResetTourGuide']);
    }

    #[Test]
    public function member_may_not_reset_somebody_else(): void
    {
        $this->assertFalse($this->userAttributes(self::ADMIN, self::MEMBER)['canResetTourGuide']);
    }

    #[Test]
    public function a_moderator_with_the_permission_may_reset_anybody(): void
    {
        $this->assertTrue($this->userAttributes(self::MEMBER, self::ADMIN)['canResetTourGuide']);
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
