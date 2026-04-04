import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChatSessions, useChatSession, useSendChatMessage, useCreateChatSession, useDeleteChatSession } from '@/hooks/use-ai-chat'
import { Loader2, MessageSquare, Plus, Trash2, Send } from 'lucide-react'

export function AIChatPage() {
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const createSession = useCreateChatSession()
  const deleteSession = useDeleteChatSession()

  const handleNewChat = async () => {
    const session = await createSession.mutateAsync('New Chat')
    setSelectedSession(session.id)
  }

  if (sessionsLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Chats</h2>
              <Button size="sm" variant="outline" onClick={handleNewChat}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {sessions?.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg cursor-pointer ${selectedSession === session.id ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs text-gray-500 truncate">{session.preview}</div>
                </div>
              ))}
              {(!sessions || sessions.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No chats yet</p>
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          {selectedSession ? (
            <ChatWindow sessionId={selectedSession} onDelete={() => { deleteSession.mutate(selectedSession); setSelectedSession(null); }} />
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Campus Connect AI</h2>
              <p className="text-gray-500 mb-4">Your personal campus assistant</p>
              <p className="text-sm text-gray-400">Select a chat or create a new one to get started</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatWindow({ sessionId, onDelete }: { sessionId: string; onDelete: () => void }) {
  const { data: session, isLoading } = useChatSession(sessionId)
  const sendMessage = useSendChatMessage()
  const [input, setInput] = useState('')
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; message: string }>>([])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMessage = input
    setInput('')
    setLocalMessages((prev) => [...prev, { role: 'user', message: userMessage }])
    
    try {
      const result = await sendMessage.mutateAsync({ message: userMessage, session_id: sessionId })
      setLocalMessages((prev) => [
        ...prev,
        { role: 'user', message: result.user_message.message },
        { role: 'assistant', message: result.assistant_message.message }
      ])
    } catch (error) {
      console.error(error)
    }
  }

  const allMessages = [
    ...(session?.messages || []).map((m) => ({ role: m.role, message: m.message })),
    ...localMessages
  ]

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold truncate">{session?.title || 'Chat'}</h2>
        <Button size="sm" variant="outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>Start a conversation!</p>
            <p className="text-sm">Ask about studying, campus events, mental health, or anything else</p>
          </div>
        )}
        {allMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-900'}`}>
              {msg.message}
            </div>
          </div>
        ))}
        {sendMessage.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button type="submit" disabled={sendMessage.isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}
