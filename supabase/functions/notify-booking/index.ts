// Supabase Edge Function: notify-booking
// 客户提交预约后，向管理员发送邮件通知（通过 Resend）
//
// 部署方式：
//   supabase functions deploy notify-booking
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//
// Resend 免费账号：https://resend.com（100封/天）
// 需要在 Resend 验证发件域名，或使用 onboarding@resend.dev（仅可发给自己）

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const { booking_request_id } = await req.json();
    if (!booking_request_id) return new Response('missing id', { status: 400, headers: CORS });

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 读取预约详情
    const { data: bk } = await sb
      .from('booking_requests')
      .select('owner_name, owner_phone, cat_name, check_in_date, check_out_date, token_id')
      .eq('id', booking_request_id)
      .single();
    if (!bk) return new Response('not found', { status: 404, headers: CORS });

    // 找到管理员 user_id
    const { data: token } = await sb
      .from('booking_tokens')
      .select('created_by')
      .eq('id', bk.token_id)
      .single();
    if (!token) return new Response('token not found', { status: 404, headers: CORS });

    // 读取管理员通知邮箱
    const { data: cfg } = await sb
      .from('admin_settings')
      .select('notification_email')
      .eq('user_id', token.created_by)
      .single();

    const toEmail = cfg?.notification_email;
    if (!toEmail) return new Response('no notification email configured', { status: 200, headers: CORS });

    const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_KEY) return new Response('RESEND_API_KEY not set', { status: 500, headers: CORS });

    // 发送邮件
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: '阿里嘎多猫咪寄养 <onboarding@resend.dev>',
        to: [toEmail],
        subject: `🐱 新预约申请：${bk.cat_name}（${bk.owner_name}）`,
        html: `
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#2D1B14">
  <h2 style="color:#FF6B6B;margin-top:0">🐱 收到新预约申请！</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#8B6B63;width:80px">猫咪</td><td style="font-weight:700">${bk.cat_name}</td></tr>
    <tr><td style="padding:6px 0;color:#8B6B63">主人</td><td style="font-weight:700">${bk.owner_name}</td></tr>
    <tr><td style="padding:6px 0;color:#8B6B63">电话</td><td>${bk.owner_phone}</td></tr>
    <tr><td style="padding:6px 0;color:#8B6B63">入住</td><td>${bk.check_in_date}</td></tr>
    <tr><td style="padding:6px 0;color:#8B6B63">退房</td><td>${bk.check_out_date}</td></tr>
  </table>
  <p style="margin-top:20px;color:#8B6B63;font-size:13px">请登录寄养管理系统查看详情并确认预约。</p>
</div>`,
      }),
    });

    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
