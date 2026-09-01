export interface PickedElement {
    selector: string;
    matches: number;
}
/**
 * Open the forum in a second window and let the admin point at the element
 * their step is about.
 *
 * Resolves with `null` when they close the window without picking, which is
 * also what happens if the browser blocks the popup.
 */
export default function pickElement(mode: 'pick' | 'test', selector?: string | null): Promise<PickedElement | null>;
