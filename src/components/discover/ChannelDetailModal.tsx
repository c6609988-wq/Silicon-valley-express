import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import { Channel } from '@/types';
import { Button } from '@/components/ui/button';

interface ChannelDetailModalProps {
  channel: Channel | null;
  onClose: () => void;
  onSubscribe: (channelId: string) => void;
  onFollowSource: (sourceId: string) => void;
}

const ChannelDetailModal = ({ channel, onClose, onSubscribe, onFollowSource }: ChannelDetailModalProps) => {
  if (!channel) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[430px] mx-auto bg-background rounded-t-2xl max-h-[75vh] overflow-y-auto pb-20"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-background p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{channel.icon}</span>
              <div>
                <h2 className="font-bold text-foreground">{channel.name}</h2>
                <p className="text-xs text-muted-foreground">{channel.sourceCount} 个信息源 · {channel.subscriberCount.toLocaleString()} 人关注</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">{channel.description}</p>

            <Button
              onClick={() => onSubscribe(channel.id)}
              variant={channel.isSubscribed ? 'secondary' : 'default'}
              className="w-full mb-4 h-10 rounded-xl"
            >
              {channel.isSubscribed ? (
                <><Check className="w-4 h-4 mr-1.5" /> 已关注</>
              ) : (
                <><Plus className="w-4 h-4 mr-1.5" /> 关注全部</>
              )}
            </Button>

            {channel.sources && channel.sources.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground mb-2">包含信息源</h3>
                {channel.sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{source.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => onFollowSource(source.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        source.isFollowed
                          ? 'bg-primary/10 text-primary'
                          : 'bg-primary text-primary-foreground'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {source.isFollowed ? '已关注' : '关注'}
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChannelDetailModal;
