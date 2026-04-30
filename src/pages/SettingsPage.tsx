import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Clock3, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type PushChannel = 'email' | 'feishu';

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const wheelItemHeight = 56;

const isValidEmail = (value: string) => /.+@.+\..+/.test(value.trim());
const isValidWebhook = (value: string) => value.trim().startsWith('https://open.feishu.cn/');

interface TimeWheelProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

const TimeWheel = ({ label, options, value, onChange }: TimeWheelProps) => {
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragOffsetRef = useRef(0);
  const movedDuringDrag = useRef(false);
  const activeIndex = Math.max(0, options.indexOf(value));

  useEffect(() => {
    if (!isDragging.current) setDragOffset(0);
  }, [value]);

  const selectIndex = (index: number) => {
    const clampedIndex = Math.min(options.length - 1, Math.max(0, index));
    const next = options[clampedIndex];
    if (next && next !== value) onChange(next);
  };

  const finishDrag = () => {
    const steps = Math.round(-dragOffsetRef.current / wheelItemHeight);
    dragOffsetRef.current = 0;
    setDragOffset(0);
    selectIndex(activeIndex + steps);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    selectIndex(activeIndex + Math.sign(event.deltaY));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    isDragging.current = true;
    movedDuringDrag.current = false;
    dragStartY.current = event.clientY;
    dragOffsetRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    event.preventDefault();
    const nextOffset = event.clientY - dragStartY.current;
    movedDuringDrag.current = movedDuringDrag.current || Math.abs(nextOffset) > 4;
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        aria-label={`${label}减少`}
        onClick={() => selectIndex(activeIndex - 1)}
        className="flex h-7 w-20 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      <div
        role="listbox"
        aria-label={label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{
          height: wheelItemHeight * 3,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
          touchAction: 'none',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 24%, black 76%, transparent 100%)',
        }}
      >
        <div
          style={{
            transform: `translateY(${wheelItemHeight - activeIndex * wheelItemHeight + dragOffset}px)`,
            transition: isDragging.current ? 'none' : 'transform 0.18s ease',
          }}
        >
          {options.map((item, index) => {
            const active = item === value;
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  if (movedDuringDrag.current) return;
                  dragOffsetRef.current = 0;
                  setDragOffset(0);
                  selectIndex(index);
                }}
                style={{
                  height: wheelItemHeight,
                  width: '100%',
                  borderRadius: 16,
                  border: active ? '1px solid rgba(26,115,232,0.22)' : '1px solid transparent',
                  background: active ? 'rgba(26,115,232,0.07)' : 'transparent',
                  color: active ? '#111827' : '#A8B0BD',
                  fontSize: active ? 30 : 24,
                  fontWeight: active ? 650 : 500,
                  lineHeight: 1,
                  transition: 'background 0.16s, color 0.16s, font-size 0.16s',
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-label={`${label}增加`}
        onClick={() => selectIndex(activeIndex + 1)}
        className="flex h-7 w-20 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
};

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

          <div className="mx-auto grid max-w-[310px] grid-cols-[1fr_auto_1fr] items-center gap-4">
            <TimeWheel label="选择小时" options={hours} value={hour} onChange={setHour} />
            <span className="pb-1 text-3xl font-bold text-foreground">:</span>
            <TimeWheel label="选择分钟" options={minutes} value={minute} onChange={setMinute} />
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
