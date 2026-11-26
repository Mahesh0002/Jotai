/**
 * Cloud music control is disabled in privacy mode. The sidebar keeps this
 * component mounted for layout stability, but it performs no network requests.
 */
export function NowPlayingWidget() {
  return null;
}
