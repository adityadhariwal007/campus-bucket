export type BuckExpression =
  | "neutral"
  | "curious"
  | "happy"
  | "thoughtful"
  | "gentle";
export function buckReaction(
  path: string,
  ready: boolean,
  hasError: boolean,
  added: boolean,
  greeting: boolean,
): { expression: BuckExpression; message: string } {
  if (hasError)
    return {
      expression: "gentle",
      message:
        "A little hiccup. Check the message on the page and try again when you’re ready.",
    };
  if (!ready)
    return {
      expression: "thoughtful",
      message: "Getting things ready for your next chapter.",
    };
  if (added)
    return {
      expression: "happy",
      message: "A good find, added to your bucket.",
    };
  if (greeting)
    return {
      expression: "happy",
      message: "Hey, campus. Good to have you here.",
    };
  if (path === "/cart")
    return {
      expression: "thoughtful",
      message: "A little less packing. A little more living.",
    };
  if (path.startsWith("/marketplace"))
    return {
      expression: "curious",
      message: "Your old favourite could be someone’s next. Pass it forward.",
    };
  if (path.startsWith("/kits") || path === "/build-your-own")
    return {
      expression: "curious",
      message: "Room essentials, study staples and a few good finds.",
    };
  return {
    expression: "neutral",
    message:
      "I’m Buck, your little campus sidekick. Here for your next chapter.",
  };
}
export function hideCompanionOn(path: string) {
  return (
    path.startsWith("/admin") ||
    ["/login", "/checkout", "/marketplace/inbox", "/marketplace/sell"].some(
      (route) => path === route,
    )
  );
}
