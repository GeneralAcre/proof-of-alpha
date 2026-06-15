import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/** Light tap — button press, approach */
export async function hapticTap() {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}

/** Strong pulse — AURA win */
export async function hapticWin() {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    await new Promise((r) => setTimeout(r, 80));
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {}
}

/** Error buzz — round loss */
export async function hapticLoss() {
  try { await Haptics.notification({ type: NotificationType.Error }); } catch {}
}

/** Success — on-chain TX confirmed */
export async function hapticSuccess() {
  try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
}
