/**
 * โหมดไว้อาลัย — drains the colour out of the page it is rendered on.
 *
 * The filter has to sit on the root element, not on a wrapper div: `filter`
 * makes an element a containing block for `position: fixed` descendants, which
 * would tear the fixed header and the contact FAB loose from the viewport. The
 * document root is explicitly exempt from that rule, so targeting `html` keeps
 * the layout untouched.
 *
 * Deliberately *not* a hoisted stylesheet (`href` + `precedence`): React treats
 * hoisted styles as permanent document resources and never takes them back out,
 * so a client-side navigation off the homepage would leave every other page grey
 * until a full reload. Rendered plainly it is an ordinary element that unmounts
 * with the page. It still ships in the server HTML ahead of the content below,
 * so the greyscale is in effect before any of it paints.
 */
export function MourningTone() {
  return <style>{"html{filter:grayscale(1);-webkit-filter:grayscale(1)}"}</style>;
}
