import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { APP_NAME } from "@/lib/constants";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "チーム登録",
  description: `${APP_NAME}に野球チームを無料で登録します。メールアドレスとチーム名だけで登録でき、クレジットカードは不要です。`,
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  const termsText = readFileSync(join(process.cwd(), "public", "terms.txt"), "utf-8");
  const privacyText = readFileSync(join(process.cwd(), "public", "privacy.txt"), "utf-8");
  return <RegisterForm termsText={termsText} privacyText={privacyText} />;
}
