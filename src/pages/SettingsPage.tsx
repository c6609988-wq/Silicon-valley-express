import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Clock3, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type PushChannel = 'email' | 'feishu';

const hours = ['06', '07', '08', '09', '10'];
const minutes = ['00', '01', '02'];

const isValidEmail = (value: string) => /.+@.+\..+/.test(value.trim());
const isValidWebhook = (value: string) => value.trim().startsWith('https://open.feishu.cn/');

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [channel, setChannel] = useState<PushChannel>('email');
  const [email, setEmail] = useState('');
  const [webhook, setWebhook] = useState('');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');

  const selectedTarget = channel === 'email' ? email : webhook;
  const isTargetValid = useMemo(() => (
    channel === 'email' ? isValidEmail(email) : isValidWebhook(webhook)
  ), [channel, email, webhook]);

  const validationText = channel === 'email'
    ? '请输入有效的邮箱地址'
    : '请输入有效的飞书 Webhook 地址';

  const handleSave = () => {
    if (!isTargetValid) return;

    localStorage.setItem('push_settings', JSON.stringify({
      channel,
      target: selectedTarget.trim(),
      time: `${hour}:${minute}`,
    }));

    toast({
      title: '保存成功',
      description: `每天 ${hour}:${minute} 将通过${channel === 'email' ? '邮件' : '飞书'}发送日报`,
    });
  };

  return (
    <MobileLayout showNav={false}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <motion.button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-xl font-bold text-foreground">推送设置</h1>
        </div>
      </div>

      <div className="px-4 py-7 pb-8 space-y-8">
        <section>
          <h2 className="text-base font-medium text-foreground mb-4">推送渠道</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`relative h-[112px] rounded-3xl border-2 transition-colors ${
                channel === 'email'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              {channel === 'email' && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  channel === 'email' ? 'bg-primary/12' : 'bg-muted'
                }`}>
                  <Mail className={`h-6 w-6 ${channel === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                </span>
                <span className={`text-base ${channel === 'email' ? 'text-primary' : 'text-foreground'}`}>邮件</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChannel('feishu')}
              className={`relative h-[112px] rounded-3xl border-2 transition-colors ${
                channel === 'feishu'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              {channel === 'feishu' && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                  channel === 'feishu' ? 'bg-primary/12' : 'bg-muted'
                }`}>
                  🪐
                </span>
                <span className={`text-base ${channel === 'feishu' ? 'text-primary' : 'text-foreground'}`}>飞书</span>
              </div>
            </button>
          </div>
        </section>

        <section className="space-y-3">
          {channel === 'email' ? (
            <>
              <h2 className="text-base font-medium text-foreground">接收邮箱</h2>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                className="h-14 rounded-2xl bg-card text-base"
              />
              <p className="text-sm leading-6 text-muted-foreground">
                日报将发送至该邮箱，支持 QQ 邮箱、163、企业邮箱等
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-medium text-foreground">飞书机器人 Webhook</h2>
              <Input
                value={webhook}
                onChange={(event) => setWebhook(event.target.value)}
                placeholder="https://open.feishu.cn/open-apis/bot/..."
                className="h-14 rounded-2xl bg-card text-base"
              />
              <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                <p className="font-semibold text-foreground">如何获取 Webhook?</p>
                <p>1. 在飞书群中添加「自定义机器人」</p>
                <p>2. 复制生成的 Webhook 地址粘贴到此处</p>
                <p>3. 日报将以卡片消息形式发到群里</p>
              </div>
            </>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-center gap-2">
            <Clock3 className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
            <h2 className="text-base font-medium text-foreground">推送时间</h2>
          </div>

          <div className="mx-auto grid max-w-[260px] grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="space-y-4 text-center">
              {hours.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setHour(item)}
                  className={`h-12 w-full rounded-2xl text-2xl font-semibold transition-colors ${
                    hour === item
                      ? 'border border-primary/20 bg-primary/5 text-foreground'
                      : 'text-muted-foreground/45'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="pb-1 text-3xl font-bold text-foreground">:</span>
            <div className="space-y-4 text-center">
              {minutes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMinute(item)}
                  className={`h-12 w-full rounded-2xl text-2xl font-semibold transition-colors ${
                    minute === item
                      ? 'border border-primary/20 bg-primary/5 text-foreground'
                      : 'text-muted-foreground/45'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            上下滑动选择时间，每天 <span className="font-semibold text-foreground">{hour}:{minute}</span> 发送日报
          </p>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isTargetValid}
            className="h-14 w-full rounded-2xl bg-primary text-lg font-semibold text-primary-foreground transition-opacity disabled:opacity-45"
          >
            保存设置
          </button>
          {!isTargetValid && (
            <p className="text-center text-sm text-muted-foreground">{validationText}</p>
          )}
        </section>
      </div>
    </MobileLayout>
  );
};

export default SettingsPage;
