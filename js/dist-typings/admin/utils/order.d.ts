import type Model from 'flarum/common/Model';
import type Mithril from 'mithril';
interface Positioned extends Model {
    position(): number;
}
type Save = (ids: string[]) => Promise<unknown>;
export declare function applyOrder(models: Positioned[], ids: string[], save: Save): void;
export declare function moveButton(models: Positioned[], model: Positioned, delta: -1 | 1, save: Save): Mithril.Children;
export {};
