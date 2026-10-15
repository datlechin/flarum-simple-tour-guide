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
use Flarum\Testing\integration\RetrievesAuthorizedUsers;
use Flarum\Testing\integration\TestCase;
use Flarum\User\User;
use Psr\Http\Message\ResponseInterface;

abstract class TourGuideTestCase extends TestCase
{
    use RetrievesAuthorizedUsers;

    protected const ADMIN = 1;
    protected const MEMBER = 2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->extension('datlechin-simple-tour-guide');

        $this->prepareDatabase([
            User::class => [
                array_merge($this->normalUser(), ['joined_at' => Carbon::now()]),
            ],
            'tour_guide_tours' => [
                $this->tour(),
            ],
            'tour_guide_steps' => [
                $this->step(1, 'Welcome', null, ['position' => 0]),
                $this->step(2, 'The header', '#header-primary', ['position' => 1, 'devices' => 'desktop']),
                $this->step(3, 'Home', '#home-link', ['position' => 2]),
            ],
        ]);
    }

    protected function tour(array $overrides = []): array
    {
        return $overrides + [
            'id' => 1,
            'key' => 'welcome',
            'title' => 'Welcome tour',
            'is_enabled' => 1,
            'start_mode' => 'auto',
            'route' => 'index',
            'devices' => 'any',
            'max_account_age_days' => null,
            'position' => 0,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }

    protected function step(int $id, string $title, ?string $target, array $overrides = []): array
    {
        return $overrides + [
            'id' => $id,
            'tour_id' => 1,
            'title' => $title,
            'content' => "<t>Body of $title.</t>",
            'target' => $target,
            'placement' => 'auto',
            'devices' => 'any',
            'is_enabled' => 1,
            'clicks_target' => 0,
            'advance_on_click' => 0,
            'position' => 0,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ];
    }

    protected function json(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true) ?? [];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    protected function availableTo(int $userId): array
    {
        return $this->tours($userId, ['filter' => ['available' => '1']]);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    protected function tours(int $userId, array $query = []): array
    {
        $response = $this->send(
            $this->request('GET', '/api/tour-guide-tours', ['authenticatedAs' => $userId])
                ->withQueryParams($query + ['include' => 'enabledSteps,completion'])
        );

        $this->assertEquals(200, $response->getStatusCode(), (string) $response->getBody());

        $document = $this->json($response);
        $included = collect($document['included'] ?? [])->keyBy(fn (array $resource) => $resource['type'].':'.$resource['id']);

        return collect($document['data'])
            ->mapWithKeys(fn (array $tour) => [$tour['attributes']['key'] => $tour['attributes'] + [
                'steps' => collect($tour['relationships']['enabledSteps']['data'] ?? [])
                    ->map(fn (array $link) => $included[$link['type'].':'.$link['id']]['attributes'])
                    ->all(),
                'completed' => ! empty($tour['relationships']['completion']['data']),
                'relationships' => array_keys($tour['relationships'] ?? []),
            ]])
            ->all();
    }

    protected function record(int $userId, string $outcome, ?int $lastStepId = null, int $tourId = 1): ResponseInterface
    {
        return $this->send($this->request('POST', '/api/tour-guide-completions', [
            'authenticatedAs' => $userId,
            'json' => [
                'data' => [
                    'type' => 'tour-guide-completions',
                    'attributes' => ['outcome' => $outcome],
                    'relationships' => [
                        'tour' => ['data' => ['type' => 'tour-guide-tours', 'id' => (string) $tourId]],
                        'lastStep' => ['data' => $lastStepId ? ['type' => 'tour-guide-steps', 'id' => (string) $lastStepId] : null],
                    ],
                ],
            ],
        ]));
    }

    protected function patchStep(int $id, array $attributes): ResponseInterface
    {
        return $this->send($this->request('PATCH', "/api/tour-guide-steps/$id", [
            'authenticatedAs' => self::ADMIN,
            'json' => ['data' => ['type' => 'tour-guide-steps', 'id' => (string) $id, 'attributes' => $attributes]],
        ]));
    }
}
