import { useState } from 'react'
import { useCreateAnonymousPost } from '@/hooks/use-posts'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Ghost, Image, AlertTriangle, Lightbulb, MessageSquare, HelpCircle } from 'lucide-react'
import type { PostCategory } from '@/types'

const categories = [
  { value: 'complaint', label: 'Complaint', icon: AlertTriangle, color: 'text-red-500' },
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'experience', label: 'Experience', icon: MessageSquare, color: 'text-blue-500' },
  { value: 'qna', label: 'Q&A', icon: HelpCircle, color: 'text-green-500' },
]

export function AnonymousComposer() {
  const createPost = useCreateAnonymousPost()
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<PostCategory | null>(null)

  const handleSubmit = async () => {
    if (!content.trim()) return

    createPost.mutate({
      content: content.trim(),
      category: category || undefined,
    })

    setContent('')
    setCategory(null)
  }

  return (
    <Card className="p-4 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <Ghost className="h-5 w-5 text-primary" />
        <span className="font-semibold">Share Anonymously</span>
      </div>

      <Textarea
        placeholder="Share your thoughts, complaints, or experiences anonymously..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] resize-none text-base"
      />

      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">Category (optional)</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={category === cat.value ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setCategory(category === cat.value ? null : cat.value as PostCategory)}
              className="gap-2"
            >
              <cat.icon className={`h-4 w-4 ${cat.color}`} />
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Image className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Ghost className="h-3 w-3" />
          <span>Your identity will be protected</span>
        </div>

        <Button onClick={handleSubmit} disabled={!content.trim() || createPost.isPending}>
          {createPost.isPending ? 'Submitting...' : 'Submit Anonymously'}
        </Button>
      </div>
    </Card>
  )
}
