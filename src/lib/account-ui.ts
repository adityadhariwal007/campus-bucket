export function ribbonProgress(top: number, height: number, viewport: number, reduced: boolean) {
  return reduced ? 1 : Math.min(1, Math.max(0, (viewport * .95 - top) / (height + viewport * .2)));
}
export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < 8 || password.length > 128 || password !== confirmation)
    throw new Error("Use 8–128 characters and enter the same password twice.");
}
