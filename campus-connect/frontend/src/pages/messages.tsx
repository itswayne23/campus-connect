import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useConversations, useMessages, useSendMessage } from '@/hooks/use-messages'
import { useAuthStore } from '@/store/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Send, MessageCircle, Search, Users, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { User, Message } from '@/types'

export function MessagesPage() {
  const { user } = useAuthStore()
  const { data: conversations, isLoading: loadingConversations } = useConversations()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'conversations' | 'search'>('conversations')
  const [selectedUserInfo, setSelectedUserInfo] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const sendMessage = useSendMessage()

  const { data: messages, isLoading: loadingMessages, refetch } = useMessages(selectedUserId || '')

  useQuery({
    queryKey: ['user', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null
      const response = await api.get<User>(`/users/${selectedUserId}`)
      setSelectedUserInfo(response.data)
      return response.data
    },
    enabled: !!selectedUserId,
  })

  useEffect(() => {
    if (messages && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (selectedUserId) {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] })
      refetch()
    }
  }, [selectedUserId, queryClient, refetch])

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', 'users', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return []
      const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`)
      return response.data.filter((u: User) => u.id !== user?.id)
    },
    enabled: searchQuery.length >= 2 && activeTab === 'search',
  })

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const handleSend = useCallback(() => {
    if (!messageText.trim() || !selectedUserId) return

    sendMessage.mutate(
      { receiver_id: selectedUserId, content: messageText.trim() },
      {
        onSuccess: () => {
          setMessageText('')
          queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
      }
    )
  }, [messageText, selectedUserId, sendMessage, queryClient])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId)
    setActiveTab('conversations')
    setSearchQuery('')
  }

  const handleBackToList = () => {
    setSelectedUserId(null)
    setSelectedUserInfo(null)
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (loadingConversations) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <Card className="h-[calc(100vh-12rem)] flex overflow-hidden">
        {!isMobile && (
          <div className="w-80 border-r flex flex-col">
            <div className="p-2 border-b flex gap-1">
              <Button
                variant={activeTab === 'conversations' ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setActiveTab('conversations')}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Chats
              </Button>
              <Button
                variant={activeTab === 'search' ? 'secondary' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setActiveTab('search')}
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>
            
            {activeTab === 'conversations' ? (
              <div className="flex-1 overflow-y-auto">
                {conversations && conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => handleSelectUser(conv.user_id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left ${
                        selectedUserId === conv.user_id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {getInitials(conv.username)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs flex items-center justify-center rounded-full">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold truncate">{conv.username}</p>
                          {conv.last_message && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conv.last_message.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message.sender_id === user?.id ? 'You: ' : ''}
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start a new conversation</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setActiveTab('search')}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Find People
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b">
                  <Input 
                    placeholder="Search people..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {searchLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : searchResults && searchResults.length > 0 ? (
                    searchResults.map((searchUser) => (
                      <button
                        key={searchUser.id}
                        onClick={() => handleSelectUser(searchUser.id)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={searchUser.avatar_url || undefined} alt={searchUser.username} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {getInitials(searchUser.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{searchUser.username}</p>
                          {searchUser.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{searchUser.bio}</p>
                          )}
                          {searchUser.university && (
                            <p className="text-xs text-muted-foreground">{searchUser.university}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </button>
                    ))
                  ) : searchQuery ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Search for people you know</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {selectedUserId ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={handleBackToList}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUserInfo?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {selectedUserInfo ? getInitials(selectedUserInfo.username) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link to={`/profile/${selectedUserId}`} className="font-semibold hover:underline">
                      {selectedUserInfo?.username || 'User'}
                    </Link>
                    {selectedUserInfo?.university && (
                      <p className="text-xs text-muted-foreground">{selectedUserInfo.university}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <>
                    {messages.map((msg, index) => {
                      const isOwnMessage = msg.sender_id === user?.id
                      const showAvatar = !isOwnMessage && (
                        index === 0 || messages[index - 1]?.sender_id !== msg.sender_id
                      )
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwnMessage && showAvatar && (
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={selectedUserInfo?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {selectedUserInfo ? getInitials(selectedUserInfo.username) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!isOwnMessage && !showAvatar && <div className="w-10" />}
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 rounded-bl-md shadow-sm'
                            }`}
                          >
                            {msg.media_url && (
                              <img 
                                src={msg.media_url} 
                                alt=" attachment" 
                                className="rounded-lg mb-2 max-w-full" 
                              />
                            )}
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-white/70' : 'text-muted-foreground'
                            }`}>
                              {formatDate(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Send a message to start the conversation
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!messageText.trim() || sendMessage.isPending}
                    size="icon"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gray-50 dark:bg-gray-900/50">
              <div className="text-center">
                <MessageCircle className="h-20 w-20 mx-auto mb-6 opacity-30" />
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm">Choose from your existing conversations or start a new one</p>
                <Button 
                  className="mt-6"
                  onClick={() => setActiveTab('search')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
