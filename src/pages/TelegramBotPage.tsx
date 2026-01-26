import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Bot, MessageSquare, UserPlus } from 'lucide-react';

export function TelegramBotPage() {
  usePageMeta('telegram-bot', 'Telegram Bot');

  return (
    <div className="bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#0088cc]/10">
            <Bot className="h-10 w-10 text-[#0088cc]" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Telegram Bot</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Stay updated with Terra DAO proposals directly in your Telegram chats
          </p>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Introduction Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                About the Bot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The{' '}
                <span className="font-mono font-semibold text-foreground">@terra_phoenix_bot</span>{' '}
                helps you track proposals from Terra DAOs. Add it to your Telegram groups or private
                chats to receive real-time notifications when new proposals are created.
              </p>
            </CardContent>
          </Card>

          {/* Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold">1. Add the Bot</h3>
                <p className="mb-2 text-muted-foreground">
                  Add{' '}
                  <span className="font-mono font-semibold text-foreground">
                    @terra_phoenix_bot
                  </span>{' '}
                  to your Telegram group or start a private chat with it.
                </p>
                <a
                  href="https://t.me/terra_phoenix_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#0088cc] hover:underline"
                >
                  Open @terra_phoenix_bot
                  <span className="text-xs">↗</span>
                </a>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">2. Subscribe to a DAO</h3>
                <p className="mb-3 text-muted-foreground">
                  Use the subscribe command with a DAO address to start receiving notifications:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <code className="text-sm">
                    /subscribe{' '}
                    <span className="text-muted-foreground">
                      {'{'}address{'}'}
                    </span>
                  </code>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Example:</p>
                <div className="mt-2 rounded-lg bg-muted p-4">
                  <code className="text-sm">/subscribe terra1abc...xyz</code>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold">3. Unsubscribe from a DAO</h3>
                <p className="mb-3 text-muted-foreground">
                  To stop receiving notifications from a DAO, use the unsubscribe command:
                </p>
                <div className="rounded-lg bg-muted p-4">
                  <code className="text-sm">
                    /unsubscribe{' '}
                    <span className="text-muted-foreground">
                      {'{'}address{'}'}
                    </span>
                  </code>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Example:</p>
                <div className="mt-2 rounded-lg bg-muted p-4">
                  <code className="text-sm">/unsubscribe terra1abc...xyz</code>
                </div>
              </div>

              <div className="rounded-lg border-l-4 border-[#0088cc] bg-[#0088cc]/5 p-4">
                <p className="text-sm">
                  <span className="font-semibold">Note:</span> Only group admins can subscribe to
                  DAOs. Once subscribed, all group members will receive proposal notifications.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0088cc]" />
                  <span className="text-muted-foreground">
                    Real-time notifications when new proposals are created
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0088cc]" />
                  <span className="text-muted-foreground">
                    Support for both group chats and private conversations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0088cc]" />
                  <span className="text-muted-foreground">
                    Subscribe to multiple DAOs in a single chat
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0088cc]" />
                  <span className="text-muted-foreground">
                    Admin-only subscription management for security
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
