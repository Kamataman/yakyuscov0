import { readFileSync } from "fs";
import { join } from "path";
import RegisterForm from "./register-form";

export default function RegisterPage() {
  const termsText = readFileSync(join(process.cwd(), "public", "terms.txt"), "utf-8");
  const privacyText = readFileSync(join(process.cwd(), "public", "privacy.txt"), "utf-8");
  return <RegisterForm termsText={termsText} privacyText={privacyText} />;
}
