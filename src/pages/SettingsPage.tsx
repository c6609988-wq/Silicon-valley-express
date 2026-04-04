import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Monitor, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import { API_BASE } from '@/lib/apiBase';

const pushTimes = ['07:00', '08:00', '09:00', '10:00', '12:00', '18:00', '20:00', '21:00'];
const themeOptions = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
];

const getInitialTheme = () => {
  return localStorage.getItem('theme') || 'system';
};

const applyTheme = (theme: string) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedTheme, setSelectedTheme] = useState(getInitialTheme);
  const [showPrompts, setShowPrompts] = useState(false);
  const [shortPrompt, setShortPrompt] = useState('');
  const [longPrompt, setLongPrompt] = useState('');
  const [threshold, setThreshold] = useState('1000');
  const [savingPrompt, setSavingPrompt] = useState(false);

  useEffect(() => {
    applyTheme(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    if (selectedTheme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [selectedTheme]);

  useEffect(() => {
    if (!showPrompts) return;
    fetch(`${API_BASE}/api/settings/prompts`)
      .then(r => r.json())
      .then(data => {
        setShortPrompt(data.SHORT_CONTENT_PROMPT || '');
        setLongPrompt(data.LONG_CONTENT_PROMPT || '');
        setThreshold(String(data.CONTENT_LENGTH_THRESHOLD || 1000));
      })
      .catch(() => {/* 后端未启动时静默失败 */});
  }, [showPrompts]);

  const savePrompt = async (key: string, value: string) => {
    setSavingPrompt(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/prompts/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('保存失败');
      toast({ title: '保存成功', description: '提示词已更新' });
    } catch {
      toast({ title: '保存失败', description: '请确认后端服务已启动', variant: 'destructive' });
    } finally {
      setSavingPrompt(false);
    }
  };

  return (
    <MobileLayout showNav={false}>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">设置</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* 推送时间 */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">推送时间</h3>
          <div className="grid grid-cols-4 gap-2">
            {pushTimes.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedTime === time
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            每日将在 {selectedTime} 推送内容摘要
          </p>
        </div>

        {/* 外观模式 */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">外观模式</h3>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectedTheme(value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-colors ${
                  selectedTheme === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* AI 提示词设置 */}
        <div>
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="w-full flex items-center justify-between py-2"
          >
            <h3 className="text-sm font-semibold text-foreground">AI 提示词设置</h3>
            {showPrompts ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showPrompts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-5 mt-3"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">短内容提示词（推文/短文）</label>
                <Textarea
                  value={shortPrompt}
                  onChange={e => setShortPrompt(e.target.value)}
                  rows={6}
                  className="text-xs font-mono resize-none"
                />
                <Button size="sm" disabled={savingPrompt} onClick={() => savePrompt('SHORT_CONTENT_PROMPT', shortPrompt)} className="w-full gap-2">
                  <Save className="w-3.5 h-3.5" />保存短内容提示词
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">长内容提示词（视频/长文）</label>
                <Textarea
                  value={longPrompt}
                  onChange={e => setLongPrompt(e.target.value)}
                  rows={6}
                  className="text-xs font-mono resize-none"
                />
                <Button size="sm" disabled={savingPrompt} onClick={() => savePrompt('LONG_CONTENT_PROMPT', longPrompt)} className="w-full gap-2">
                  <Save className="w-3.5 h-3.5" />保存长内容提示词
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">长/短内容字数阈值</label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  className="h-9"
                />
                <Button size="sm" disabled={savingPrompt} onClick={() => savePrompt('CONTENT_LENGTH_THRESHOLD', threshold)} className="w-full gap-2">
                  <Save className="w-3.5 h-3.5" />保存阈值
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default SettingsPage;
