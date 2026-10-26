import { BASE_PATH } from "./basePath";

/**
 * Prefixes a `public/` path so it resolves under the app's basePath.
 *
 * `next/link` applies basePath on its own, but `next/image`, a plain `<a href>`
 * and raw `fetch()` do not: the Next docs are explicit that "you will need to
 * add the basePath in front of src". Every absolute reference to something in
 * `public/` therefore goes through here.
 *
 * NEXT_PUBLIC_ASSET_BASE_URL overrides it with an absolute origin, for serving
 * `public/` from a CDN instead.
 */
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(
  /\/+$/,
  ""
);

export function assetPath(path: `/${string}`): string {
  return `${ASSET_BASE_URL || BASE_PATH}${path}`;
}
