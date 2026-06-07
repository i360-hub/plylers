// Pages that render the GHL lead form (anchor id="quote").
// A "Get a Free Estimate" CTA should jump to the on-page form when present,
// otherwise send the visitor to the form on /contact.
export const FORM_PATHS = new Set<string>([
  '/',
  '/contact',
  '/tree-removal',
  '/tree-trimming',
  '/stump-grinding',
  '/emergency-storm-damage',
  '/tree-service-arkadelphia-ar',
  '/tree-service-hot-springs-ar',
  '/tree-service-caddo-valley-ar',
  '/tree-service-bismarck-ar',
  '/tree-service-gurdon-ar',
  '/tree-service-malvern-ar',
  '/tree-service-glenwood-ar',
  '/tree-service-amity-ar',
  '/tree-service-lake-hamilton-ar',
]);

/** Where a "Get a Free Estimate" button should go from the given page.
 *  Robust to build.format:'file' (pathname may be "/foo.html") and trailing slashes. */
export function quoteHref(pathname: string): string {
  let p = (pathname || '/').replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '');
  if (p === '') p = '/';
  return FORM_PATHS.has(p) ? '#quote' : '/contact#quote';
}
