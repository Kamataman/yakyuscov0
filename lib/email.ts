import { Resend } from "resend";
import { APP_NAME } from "@/lib/constants";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface TeamRegistrationEmailParams {
  to: string;
  teamName: string;
  teamUrl: string;
}

export async function sendTeamRegistrationEmail(
  params: TeamRegistrationEmailParams
): Promise<void> {
  const { to, teamName, teamUrl } = params;
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
    to,
    subject: `【${APP_NAME}】${teamName} の登録が完了しました`,
    html: buildHtml({ teamName, teamUrl }),
  });
}

interface HtmlParams {
  teamName: string;
  teamUrl: string;
}

function buildHtml({ teamName, teamUrl }: HtmlParams): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME} チーム登録完了</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 22px; color: #1e293b; margin: 0 0 8px; }
    .header p { font-size: 14px; color: #64748b; margin: 0; }
    .team-url-box { display: block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 20px; color: #2563eb; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; margin: 24px 0; }
    .section-title { font-size: 15px; font-weight: 700; color: #1e293b; margin: 28px 0 12px; }
    .steps { list-style: none; padding: 0; margin: 0; }
    .steps li { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #475569; }
    .steps li:last-child { border-bottom: none; }
    .step-num { font-weight: 700; color: #1e293b; flex-shrink: 0; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>チーム登録が完了しました</h1>
      <p>${APP_NAME} へようこそ、<strong>${teamName}</strong> の管理者さん！</p>
    </div>

    <p style="font-size:14px;color:#475569;margin:0 0 8px;">チームページはこちらからアクセスできます：</p>
    <a href="${teamUrl}" class="team-url-box">${teamUrl}</a>

    <p class="section-title">はじめにやること</p>
    <ul class="steps">
      <li>
        <span class="step-num">1</span>
        <div><strong>管理者ログイン</strong> — チームページから管理者としてサインインします</div>
      </li>
      <li>
        <span class="step-num">2</span>
        <div><strong>選手を追加する</strong> — 選手一覧ページでメンバーを登録します</div>
      </li>
      <li>
        <span class="step-num">3</span>
        <div><strong>試合を記録する</strong> — 試合登録からURLを共有して、みんなでスコアを入力します</div>
      </li>
      <li>
        <span class="step-num">4</span>
        <div><strong>個人成績を確認する</strong> — 選手ごとの打率・成績を一覧で確認できます</div>
      </li>
    </ul>

    <div class="footer">
      <p>${APP_NAME} — チームの記録を管理するアプリ</p>
      <p>このメールはチーム登録完了時に自動送信されています。</p>
    </div>
  </div>
</body>
</html>`;
}
