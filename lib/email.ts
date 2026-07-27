import { Resend } from "resend";
import { APP_NAME } from "@/lib/constants";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * ユーザー由来の値をHTMLメール本文に埋め込む前に必ず通すこと。
 * テンプレートリテラルへの素通しはHTMLインジェクションの原因になる。
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface TeamRegistrationEmailParams {
  to: string;
  teamName: string;
  teamUrl: string;
}

export async function sendTeamRegistrationEmail(
  params: TeamRegistrationEmailParams
): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY が未設定のため、チーム登録メールの送信をスキップしました。");
    return;
  }

  const { to, teamName, teamUrl } = params;
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
    to,
    subject: `【${APP_NAME}】${teamName} の登録が完了しました`,
    html: buildHtml({ teamName, teamUrl }),
  });
}

export interface AdminInviteEmailParams {
  to: string;
  teamName: string;
  role: "owner" | "admin";
  inviteUrl: string;
}

export async function sendAdminInviteEmail(
  params: AdminInviteEmailParams
): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY が未設定のため、管理者招待メールの送信をスキップしました。");
    return;
  }

  const { to, teamName, role, inviteUrl } = params;
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
    to,
    subject: `【${APP_NAME}】${teamName} の管理者に招待されました`,
    html: buildInviteHtml({ teamName, role, inviteUrl }),
  });
}

interface InviteHtmlParams {
  teamName: string;
  role: "owner" | "admin";
  inviteUrl: string;
}

function buildInviteHtml({ teamName, role, inviteUrl }: InviteHtmlParams): string {
  const roleLabel = role === "owner" ? "オーナー" : "管理者";
  const safeTeamName = escapeHtml(teamName);
  const safeInviteUrl = escapeHtml(inviteUrl);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME} 管理者招待</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 22px; color: #1e293b; margin: 0 0 8px; }
    .header p { font-size: 14px; color: #64748b; margin: 0; }
    .cta-box { display: block; background: #2563eb; border-radius: 8px; padding: 14px 20px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; text-align: center; margin: 24px 0; }
    .note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 8px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${roleLabel}として招待されました</h1>
      <p><strong>${safeTeamName}</strong> の${roleLabel}として ${APP_NAME} への招待が届いています</p>
    </div>

    <p style="font-size:14px;color:#475569;margin:0 0 8px;">以下のボタンからパスワードを設定して、ログインしてください：</p>
    <a href="${safeInviteUrl}" class="cta-box">パスワードを設定してはじめる</a>
    <p class="note">このリンクの有効期限は7日間です</p>

    <div class="footer">
      <p>${APP_NAME} — チームの記録を管理するアプリ</p>
      <p>心当たりがない場合は、このメールを破棄してください。</p>
    </div>
  </div>
</body>
</html>`;
}

export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams
): Promise<void> {
  if (!resend) {
    console.warn("RESEND_API_KEY が未設定のため、パスワード再設定メールの送信をスキップしました。");
    return;
  }

  const { to, resetUrl } = params;
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
    to,
    subject: `【${APP_NAME}】パスワード再設定のご案内`,
    html: buildPasswordResetHtml({ resetUrl }),
  });
}

function buildPasswordResetHtml({ resetUrl }: { resetUrl: string }): string {
  const safeResetUrl = escapeHtml(resetUrl);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME} パスワード再設定</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 22px; color: #1e293b; margin: 0 0 8px; }
    .header p { font-size: 14px; color: #64748b; margin: 0; }
    .cta-box { display: block; background: #2563eb; border-radius: 8px; padding: 14px 20px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; text-align: center; margin: 24px 0; }
    .note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 8px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>パスワード再設定のご案内</h1>
      <p>${APP_NAME} のパスワード再設定リクエストを受け付けました</p>
    </div>

    <p style="font-size:14px;color:#475569;margin:0 0 8px;">以下のボタンから新しいパスワードを設定してください：</p>
    <a href="${safeResetUrl}" class="cta-box">パスワードを再設定する</a>
    <p class="note">このリンクの有効期限は1時間です</p>

    <div class="footer">
      <p>${APP_NAME} — チームの記録を管理するアプリ</p>
      <p>心当たりがない場合は、このメールを破棄してください。パスワードは変更されません。</p>
    </div>
  </div>
</body>
</html>`;
}

interface HtmlParams {
  teamName: string;
  teamUrl: string;
}

function buildHtml({ teamName, teamUrl }: HtmlParams): string {
  const safeTeamName = escapeHtml(teamName);
  const safeTeamUrl = escapeHtml(teamUrl);
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
      <p>${APP_NAME} へようこそ、<strong>${safeTeamName}</strong> の管理者さん！</p>
    </div>

    <p style="font-size:14px;color:#475569;margin:0 0 8px;">チームページはこちらからアクセスできます：</p>
    <a href="${safeTeamUrl}" class="team-url-box">${safeTeamUrl}</a>

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

export interface ContactEmailParams {
  to: string;
  teamName: string;
  fromName: string;
  fromEmail: string;
  message: string;
}

/**
 * チーム問い合わせフォームからの送信をチームオーナーへ転送する。
 * RESEND_API_KEY未設定・送信失敗を成功扱いにしない（既存3関数のwarn-skipとは異なり、明示的にエラーを投げる）。
 */
export async function sendContactEmail(params: ContactEmailParams): Promise<void> {
  if (!resend) {
    throw new Error("RESEND_API_KEY が未設定のため、問い合わせメールを送信できません");
  }

  const { to, teamName, fromName, fromEmail, message } = params;
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
    to,
    replyTo: fromEmail,
    subject: `【${APP_NAME}】${teamName} 宛にお問い合わせが届きました`,
    html: buildContactHtml({ teamName, fromName, fromEmail, message }),
  });

  if (error) {
    throw new Error(`問い合わせメールの送信に失敗しました: ${error.message}`);
  }
}

interface ContactHtmlParams {
  teamName: string;
  fromName: string;
  fromEmail: string;
  message: string;
}

function buildContactHtml({ teamName, fromName, fromEmail, message }: ContactHtmlParams): string {
  const safeTeamName = escapeHtml(teamName);
  const safeFromName = escapeHtml(fromName || "名前未記入");
  const safeFromEmail = escapeHtml(fromEmail);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME} 問い合わせ</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 22px; color: #1e293b; margin: 0 0 8px; }
    .header p { font-size: 14px; color: #64748b; margin: 0; }
    .field-label { font-size: 12px; font-weight: 700; color: #64748b; margin: 20px 0 4px; }
    .field-value { font-size: 14px; color: #1e293b; white-space: pre-wrap; word-break: break-word; }
    .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 4px; }
    .warning { margin-top: 28px; padding: 12px 16px; background: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>お問い合わせが届きました</h1>
      <p><strong>${safeTeamName}</strong> 宛に ${APP_NAME} の問い合わせフォームから連絡が届きました</p>
    </div>

    <p class="field-label">お名前</p>
    <p class="field-value">${safeFromName}</p>

    <p class="field-label">連絡先メールアドレス</p>
    <p class="field-value">${safeFromEmail}</p>

    <p class="field-label">問い合わせ内容</p>
    <div class="message-box field-value">${safeMessage}</div>

    <div class="warning">
      このメールアドレスは送信者による自己申告であり、当サービスによる本人確認は行われていません。返信の際はなりすましの可能性にご留意ください。
    </div>

    <div class="footer">
      <p>${APP_NAME} — チームの記録を管理するアプリ</p>
      <p>このメールはチーム問い合わせフォームから自動送信されています。</p>
    </div>
  </div>
</body>
</html>`;
}
