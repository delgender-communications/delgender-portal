/**
 * returns a human-readable label for a given page path
 * because staff is not technical
 */
export function pageLabel(path: string): string {
  const clean = path.split("?")[0].split("#")[0];
  if (clean === "/about") {
    return "About";
  }
  if (clean === "/booking") {
    return "Booking Form";
  }
  return "Home";
}
