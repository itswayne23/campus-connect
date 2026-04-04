import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import { useLikePost, useDeletePost, useComments, useCreateComment, useBookmarkPost, useRemoveBookmark, useUpdatePost, useRequestDeletePost, useRepostPost, useRemoveRepost } from '@/hooks/use-posts'
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Send, Bookmark, Pencil, AlertTriangle, Repeat2 } from 'lucide-react'
import { formatDate, canEditPost, canDeletePost } from '@/lib/utils'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ContentRenderer } from './content-renderer'
import type { Post, Comment } from '@/types'

interface PostCardProps {
  post: Post
}

function CommentItem({ comment }: { comment: Comment }) {
  const getInitials = (name: string) => name.slice(0, 2).toUpperCase()
  const isAnonymous = comment.is_anonymous

  return (
    <div className="flex gap-2 py-2">
      <Link to={isAnonymous ? '#' : `/profile/${comment.author_id}`}>
        <Avatar className="h-8 w-8">
          {!isAnonymous && comment.author?.avatar_url ? (
            <AvatarImage src={comment.author.avatar_url} alt={comment.author.username} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
              {getInitials(isAnonymous ? comment.anonymous_name || 'AN' : comment.author?.username || 'U')}
            </AvatarFallback>
          )}
        </Avatar>
      </Link>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
        <p className="font-semibold text-sm">
          {isAnonymous ? comment.anonymous_name : comment.author?.username || 'User'}
        </p>
        <p className="text-sm">{comment.content}</p>
        <p className="text-xs text-gray-500 mt-1">{formatDate(comment.created_at)}</p>
      </div>
    </div>
  )
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuthStore()
  const likePost = useLikePost()
  const deletePost = useDeletePost()
  const bookmarkPost = useBookmarkPost()
  const removeBookmark = useRemoveBookmark()
  const updatePost = useUpdatePost()
  const requestDeletePost = useRequestDeletePost()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isLikeAnimating, setIsLikeAnimating] = useState(false)
  
  const { data: comments } = useComments(showComments ? post.id : '')
  const createComment = useCreateComment()
  const repostPost = useRepostPost()
  const removeRepost = useRemoveRepost()
  
  const isOwner = user?.id === post.author_id
  const isAnonymous = post.is_anonymous
  const displayName = isAnonymous ? (post.anonymous_name || 'Anonymous') : (post.author?.username || 'Unknown')
  const avatarUrl = isAnonymous ? null : post.author?.avatar_url
  const profileLink = isAnonymous ? '#' : (post.author_id ? `/profile/${post.author_id}` : '#')

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  const handleLike = () => {
    setIsLikeAnimating(true)
    likePost.mutate(post.id)
    setTimeout(() => setIsLikeAnimating(false), 300)
  }

  const handleShare = async () => {
    const shareData = {
      title: 'Campus Connect',
      text: post.content.substring(0, 100) + '...',
      url: window.location.origin + `/post/${post.id}`
    }
    
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareData.url)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    createComment.mutate(
      { post_id: post.id, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('')
          toast.success('Comment added!')
        },
      }
    )
  }

  const handlePollVote = async (optionId: string) => {
    if (post.poll?.voted_option_id) return
    
    try {
      const response = await fetch(`/api/v1/posts/${post.id}/poll/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ option_id: optionId }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.poll) {
          post.poll = data.poll
          toast.success('Vote recorded!')
        }
      }
    } catch (error) {
      console.error('Vote failed:', error)
    }
  }

  return (
    <Card className="overflow-hidden animate-fade-in border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to={profileLink} onClick={(e) => isAnonymous && e.preventDefault()}>
              <Avatar className="h-10 w-10 ring-2 ring-gray-100 dark:ring-gray-800 hover:ring-blue-200 transition-all">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : (
                  <AvatarFallback className={`${isAnonymous ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'} text-white`}>
                    {getInitials(displayName)}
                  </AvatarFallback>
                )}
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  to={profileLink} 
                  onClick={(e) => isAnonymous && e.preventDefault()}
                  className={`font-semibold text-sm hover:text-blue-500 transition-colors ${isAnonymous ? '' : 'hover:underline'}`}
                >
                  {displayName}
                </Link>
                {isAnonymous && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">
                    Anonymous
                  </span>
                )}
                {post.category && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize">
                    {post.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEditPost(post.created_at) && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Post
                  </DropdownMenuItem>
                )}
                {canDeletePost(post.created_at).canDelete && (
                  <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Post
                  </DropdownMenuItem>
                )}
                {canDeletePost(post.created_at).canRequestDelete && (
                  <DropdownMenuItem className="text-orange-600 cursor-pointer" onClick={() => {
                    requestDeletePost.mutate({ postId: post.id })
                  }}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Request Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mt-2 animate-fade-in">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => {
                deletePost.mutate(post.id)
                setShowDeleteConfirm(false)
              }}>
                Yes, Delete
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  updatePost.mutate(
                    { postId: post.id, content: editContent },
                    { onSuccess: () => setIsEditing(false) }
                  )
                }}
                disabled={!editContent.trim() || updatePost.isPending}
              >
                {updatePost.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditContent(post.content)
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <ContentRenderer content={post.content} />
        )}

        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mt-3 -mx-4">
            <div className={`grid gap-1 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.media_urls.slice(0, 4).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt=""
                  className="w-full h-64 object-cover hover:opacity-95 transition-opacity cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        {post.poll && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="font-medium mb-2">{post.poll.question}</p>
            <div className="space-y-2">
              {post.poll.options.map((option, index) => {
                const percentage = post.poll!.total_votes > 0 
                  ? Math.round((option.votes / post.poll!.total_votes) * 100) 
                  : 0
                const hasVoted = post.poll!.voted_option_id === option.id
                
                return (
                  <button
                    key={option.id}
                    disabled={!!post.poll!.voted_option_id}
                    className={`w-full relative overflow-hidden rounded-md border dark:border-gray-600 px-3 py-2 text-left transition-all ${
                      hasVoted 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handlePollVote(option.id)}
                  >
                    <div 
                      className={`absolute inset-y-0 left-0 ${hasVoted ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-200 dark:bg-gray-700'}`}
                      style={{ width: `${percentage}%`, transition: 'width 0.3s ease' }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm">
                        {String.fromCharCode(65 + index)}. {option.text}
                      </span>
                      <span className="text-sm font-medium">
                        {percentage}%
                        {hasVoted && <span className="ml-1 text-blue-500">✓</span>}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {post.poll!.total_votes} vote{post.poll!.total_votes !== 1 ? 's' : ''}
              {post.poll!.voted_option_id && ' • You voted'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t dark:border-gray-800">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-full transition-all ${
                post.is_liked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 transition-transform ${post.is_liked ? 'fill-current scale-110' : ''} ${isLikeAnimating ? 'scale-125 animate-bounce' : ''}`} />
              <span className="text-sm font-medium">{post.likes_count > 0 ? post.likes_count : 'Like'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-full transition-all hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${showComments ? 'text-blue-500' : ''}`}
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className={`h-5 w-5 ${showComments ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.comments_count > 0 ? post.comments_count : 'Comment'}</span>
            </Button>

            <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-full transition-all ${
                post.is_reposted 
                  ? 'text-green-500 hover:text-green-600' 
                  : 'hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
              onClick={() => post.is_reposted ? removeRepost.mutate(post.id) : repostPost.mutate(post.id)}
            >
              <Repeat2 className={`h-5 w-5 ${post.is_reposted ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.repost_count > 0 ? post.repost_count : 'Repost'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 rounded-full transition-all ${
                post.is_bookmarked 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              }`}
              onClick={() => post.is_bookmarked ? removeBookmark.mutate(post.id) : bookmarkPost.mutate(post.id)}
            >
              <Bookmark className={`h-5 w-5 ${post.is_bookmarked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.is_bookmarked ? 'Saved' : 'Save'}</span>
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t dark:border-gray-800 animate-fade-in">
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {comments?.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              {!comments?.length && (
                <p className="text-sm text-gray-500 text-center py-2">No comments yet. Be the first to comment!</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleComment} 
                disabled={!commentText.trim() || createComment.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
