import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageCircle, Repeat2, Heart, Bookmark } from "lucide-react";

interface TwitterAggregationCardProps {
  author: string;
  handle: string;
  avatar?: string;
  publishTime: string;
  content: string;
  tags?: string[];
  aiSummary?: string;
  aiComment?: string;
  stats?: {
    replies?: number;
    retweets?: number;
    likes?: number;
  };
}

export const TwitterAggregationCard = ({
  author,
  handle,
  avatar,
  publishTime,
  content,
  tags = [],
  aiSummary,
  aiComment,
  stats = {},
}: TwitterAggregationCardProps) => {
  return (
    <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
      {/* 头部：作者信息 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {avatar || author[0]}
          </div>
          <div>
            <div className="font-semibold text-base">{author}</div>
            <div className="text-sm text-muted-foreground">@{handle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{publishTime}</span>
        </div>
      </div>

      {/* 推文内容 */}
      <div className="space-y-3">
        <p className="text-base leading-relaxed whitespace-pre-line">{content}</p>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 互动数据 */}
      {(stats.replies || stats.retweets || stats.likes) && (
        <div className="flex items-center gap-6 pt-2 border-t">
          {stats.replies && (
            <div className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 cursor-pointer transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{stats.replies}</span>
            </div>
          )}
          {stats.retweets && (
            <div className="flex items-center gap-2 text-muted-foreground hover:text-green-500 cursor-pointer transition-colors">
              <Repeat2 className="w-4 h-4" />
              <span className="text-sm">{stats.retweets}</span>
            </div>
          )}
          {stats.likes && (
            <div className="flex items-center gap-2 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{stats.likes}</span>
            </div>
          )}
          <div className="ml-auto">
            <Bookmark className="w-4 h-4 text-muted-foreground hover:text-blue-500 cursor-pointer transition-colors" />
          </div>
        </div>
      )}

      {/* AI 摘要 */}
      {aiSummary && (
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              智能摘要
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {aiSummary}
          </p>
        </div>
      )}

      {/* AI 点评 */}
      {aiComment && (
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              深度点评
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {aiComment}
          </p>
        </div>
      )}
    </Card>
  );
};
