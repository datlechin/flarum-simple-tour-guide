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

use Datlechin\FlarumSimpleTourGuide\Tour;
use Datlechin\FlarumSimpleTourGuide\TourCompletion;
use Datlechin\FlarumSimpleTourGuide\TourStep;
use Datlechin\FlarumSimpleTourGuide\TourStepTranslation;
use Flarum\Group\Group;
use PHPUnit\Framework\Attributes\Test;
use Psr\Http\Message\ResponseInterface;

class ManageToursTest extends TourGuideTestCase
{
    #[Test]
    public function admin_may_create_a_tour(): void
    {
        $response = $this->createTour(['title' => 'Second', 'key' => 'second', 'route' => 'discussion']);

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());
        $this->assertEquals(1, Tour::query()->where('key', 'second')->value('position'));
    }

    #[Test]
    public function a_tour_without_a_key_gets_one_that_validates(): void
    {
        $response = $this->createTour(['title' => 'Keyless']);

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());
        $this->assertMatchesRegularExpression('/^[a-z0-9]{8}$/', $this->json($response)['data']['attributes']['key']);
    }

    #[Test]
    public function a_new_tour_answers_with_its_defaults_and_audience(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => [
                'type' => 'tour-guide-tours',
                'attributes' => ['title' => 'Bare'],
                'relationships' => ['groups' => ['data' => [['type' => 'groups', 'id' => (string) Group::MEMBER_ID]]]],
            ]],
        ]));

        $data = $this->json($response)['data'];

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());
        $this->assertSame(['isEnabled' => true, 'startMode' => 'auto', 'devices' => 'any'], array_intersect_key($data['attributes'], array_flip(['isEnabled', 'startMode', 'devices'])));
        $this->assertEquals([['type' => 'groups', 'id' => (string) Group::MEMBER_ID]], $data['relationships']['groups']['data']);
    }

    #[Test]
    public function a_new_step_answers_with_its_defaults(): void
    {
        $attributes = $this->json($this->createStep([]))['data']['attributes'];

        $this->assertSame(
            ['placement' => 'auto', 'devices' => 'any', 'clicksTarget' => false, 'advanceOnClick' => false, 'isEnabled' => true],
            array_intersect_key($attributes, array_flip(['placement', 'devices', 'clicksTarget', 'advanceOnClick', 'isEnabled']))
        );
    }

    #[Test]
    public function a_duplicate_key_is_rejected(): void
    {
        $this->assertEquals(422, $this->createTour(['title' => 'Clash', 'key' => 'welcome'])->getStatusCode());
    }

    #[Test]
    public function member_may_not_create_a_tour(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-tours', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['data' => ['type' => 'tour-guide-tours', 'attributes' => ['title' => 'Nope']]],
        ]));

        $this->assertEquals(403, $response->getStatusCode());
    }

    #[Test]
    public function admin_sets_the_audience_by_group(): void
    {
        $response = $this->send($this->request('PATCH', '/api/tour-guide-tours/1', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['type' => 'tour-guide-tours', 'id' => '1', 'relationships' => [
                'groups' => ['data' => [['type' => 'groups', 'id' => (string) Group::MODERATOR_ID]]],
            ]]],
        ]));

        $this->assertEquals(200, $response->getStatusCode(), (string) $response->getBody());
        $this->assertEquals([Group::MODERATOR_ID], Tour::query()->find(1)->groups->pluck('id')->map(fn ($id) => (int) $id)->all());
    }

    #[Test]
    public function a_step_needs_a_tour_to_belong_to(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-steps', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['type' => 'tour-guide-steps', 'attributes' => ['title' => 'Orphan', 'description' => 'Body.']]],
        ]));

        $this->assertEquals(422, $response->getStatusCode());
    }

    #[Test]
    public function a_new_step_goes_to_the_end(): void
    {
        $response = $this->createStep([]);

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());
        $this->assertEquals(3, TourStep::query()->find($this->json($response)['data']['id'])->position);
    }

    #[Test]
    public function a_description_is_stored_parsed_and_edited_as_text(): void
    {
        $response = $this->patchStep(1, ['description' => 'Plain words.']);

        $this->assertEquals('Plain words.', $this->json($response)['data']['attributes']['description']);
        $this->assertStringStartsWith('<t>', TourStep::query()->find(1)->parsed_content);
    }

    #[Test]
    public function a_blank_title_or_description_is_rejected(): void
    {
        $this->assertEquals(422, $this->patchStep(1, ['title' => '  '])->getStatusCode());
        $this->assertEquals(422, $this->patchStep(1, ['description' => ''])->getStatusCode());
    }

    #[Test]
    public function a_target_with_a_newline_is_rejected(): void
    {
        $this->assertEquals(422, $this->createStep(['target' => "a\nb"])->getStatusCode());
    }

    #[Test]
    public function an_over_long_title_is_rejected(): void
    {
        $this->assertEquals(422, $this->createStep(['title' => str_repeat('x', 256)])->getStatusCode());
    }

    #[Test]
    public function a_blank_target_is_stored_as_no_target(): void
    {
        $this->assertEquals(200, $this->patchStep(2, ['target' => '   '])->getStatusCode());
        $this->assertNull(TourStep::query()->find(2)->target);
    }

    #[Test]
    public function titles_are_trimmed(): void
    {
        $this->patchStep(2, ['title' => '  spaced  ']);

        $this->assertEquals('spaced', TourStep::query()->find(2)->title);
    }

    #[Test]
    public function member_may_not_edit_or_delete_a_step(): void
    {
        $edit = $this->send($this->request('PATCH', '/api/tour-guide-steps/2', [
            'authenticatedAs' => self::MEMBER,
            'json' => ['data' => ['type' => 'tour-guide-steps', 'id' => '2', 'attributes' => ['target' => 'nope']]],
        ]));
        $delete = $this->send($this->request('DELETE', '/api/tour-guide-steps/2', ['authenticatedAs' => self::MEMBER]));

        $this->assertEquals(403, $edit->getStatusCode());
        $this->assertEquals(403, $delete->getStatusCode());
    }

    #[Test]
    public function deleting_a_tour_takes_everything_of_it_along(): void
    {
        $this->skipWithoutForeignKeys();

        $this->patchStep(1, ['translations' => ['vi' => ['title' => 'Xin chao', 'description' => 'Noi dung']]]);
        $this->record(self::MEMBER, 'finished');

        $response = $this->send($this->request('DELETE', '/api/tour-guide-tours/1', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals(0, TourStep::query()->count());
        $this->assertEquals(0, TourStepTranslation::query()->count());
        $this->assertEquals(0, TourCompletion::query()->count());
    }

    #[Test]
    public function deleting_a_step_forgets_it_as_anybody_last_step(): void
    {
        $this->skipWithoutForeignKeys();

        $this->record(self::MEMBER, 'dismissed', 2);

        $this->send($this->request('DELETE', '/api/tour-guide-steps/2', ['authenticatedAs' => self::ADMIN]));

        $this->assertNull(TourCompletion::query()->value('last_step_id'));
    }

    #[Test]
    public function translations_round_trip_and_clear(): void
    {
        $set = $this->patchStep(1, ['translations' => ['vi' => ['title' => 'Xin chao', 'description' => 'Noi dung']]]);

        $this->assertEquals(['title' => 'Xin chao', 'description' => 'Noi dung'], $this->json($set)['data']['attributes']['translations']['vi']);

        $cleared = $this->patchStep(1, ['translations' => ['vi' => ['title' => '', 'description' => '']]]);

        $this->assertEmpty($this->json($cleared)['data']['attributes']['translations']);
    }

    #[Test]
    public function admin_may_duplicate_a_tour_with_its_audience(): void
    {
        $this->database()->table('tour_guide_tour_group')->insert(['tour_id' => 1, 'group_id' => Group::MODERATOR_ID]);

        $response = $this->send($this->request('POST', '/api/tour-guide-tours/1/duplicate', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());

        $copy = Tour::query()->find($this->json($response)['data']['id']);

        $this->assertNotEquals('welcome', $copy->key);
        $this->assertEquals(3, $copy->steps()->count());
        $this->assertFalse($copy->is_enabled);
        $this->assertEquals([Group::MODERATOR_ID], $copy->groups->pluck('id')->map(fn ($id) => (int) $id)->all());
    }

    #[Test]
    public function admin_may_duplicate_a_step(): void
    {
        $response = $this->send($this->request('POST', '/api/tour-guide-steps/1/duplicate', ['authenticatedAs' => self::ADMIN]));

        $this->assertEquals(201, $response->getStatusCode(), (string) $response->getBody());
        $this->assertEquals(4, TourStep::query()->where('tour_id', 1)->count());
        $this->assertEquals('Body of Welcome.', TourStep::query()->find($this->json($response)['data']['id'])->content);
    }

    #[Test]
    public function member_may_not_duplicate(): void
    {
        $tour = $this->send($this->request('POST', '/api/tour-guide-tours/1/duplicate', ['authenticatedAs' => self::MEMBER]));
        $step = $this->send($this->request('POST', '/api/tour-guide-steps/1/duplicate', ['authenticatedAs' => self::MEMBER]));

        $this->assertEquals(403, $tour->getStatusCode());
        $this->assertEquals(403, $step->getStatusCode());
    }

    protected function skipWithoutForeignKeys(): void
    {
        // flarum/testing turns foreign keys off for the whole test on SQLite, so cascades only run on MySQL and PostgreSQL.
        if ($this->database()->getDriverName() === 'sqlite') {
            $this->markTestSkipped('Foreign keys are off on SQLite under flarum/testing.');
        }
    }

    protected function createTour(array $attributes): ResponseInterface
    {
        return $this->send($this->request('POST', '/api/tour-guide-tours', [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['type' => 'tour-guide-tours', 'attributes' => $attributes]],
        ]));
    }

    protected function createStep(array $attributes): ResponseInterface
    {
        return $this->send($this->request('POST', '/api/tour-guide-steps', [
            'authenticatedAs' => self::ADMIN,
            'json' => [
                'data' => [
                    'type' => 'tour-guide-steps',
                    'attributes' => $attributes + ['title' => 'New', 'description' => 'Body.'],
                    'relationships' => ['tour' => ['data' => ['type' => 'tour-guide-tours', 'id' => '1']]],
                ],
            ],
        ]));
    }
}
