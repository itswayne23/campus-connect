import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useMoodEntries, useMoodStats, useCreateMoodEntry, useDeleteMoodEntry } from '@/hooks/use-mood'
import { Loader2, Calendar, Flame, TrendingUp, Plus, Trash2, Smile, Frown, Meh, Angry, Heart, Zap } from 'lucide-react'

const moodEmojis: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😊', label: 'Happy', color: 'bg-green-100' },
  sad: { emoji: '😢', label: 'Sad', color: 'bg-blue-100' },
  anxious: { emoji: '😰', label: 'Anxious', color: 'bg-yellow-100' },
  excited: { emoji: '🤩', label: 'Excited', color: 'bg-purple-100' },
  tired: { emoji: '😴', label: 'Tired', color: 'bg-gray-100' },
  neutral: { emoji: '😐', label: 'Neutral', color: 'bg-gray-100' },
}

const moods = ['happy', 'sad', 'anxious', 'excited', 'tired', 'neutral']

export function MoodPage() {
  const { data: entries, isLoading: entriesLoading } = useMoodEntries()
  const { data: stats } = useMoodStats()
  const createEntry = useCreateMoodEntry()
  const deleteEntry = useDeleteMoodEntry()

  const [showForm, setShowForm] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMood) return

    await createEntry.mutateAsync({
      mood: selectedMood,
      note: note || undefined
    })
    setShowForm(false)
    setSelectedMood(null)
    setNote('')
  }

  if (entriesLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-4">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />
          Mood Tracker
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-4 text-center bg-pink-50 dark:bg-pink-950/30">
            <Flame className="h-8 w-8 mx-auto text-orange-500" />
            <div className="text-2xl font-bold mt-2">{stats?.stats.streak_days || 0}</div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </Card>
          <Card className="p-4 text-center bg-purple-50 dark:bg-purple-950/30">
            <Calendar className="h-8 w-8 mx-auto text-purple-500" />
            <div className="text-2xl font-bold mt-2">{stats?.stats.total_entries || 0}</div>
            <div className="text-sm text-gray-500">Entries</div>
          </Card>
          <Card className="p-4 text-center bg-blue-50 dark:bg-blue-950/30">
            {stats?.stats.average_mood && moodEmojis[stats.stats.average_mood] ? (
              <div className="text-3xl">{moodEmojis[stats.stats.average_mood].emoji}</div>
            ) : (
              <Meh className="h-8 w-8 mx-auto text-blue-500" />
            )}
            <div className="text-sm mt-2 text-gray-500">Avg Mood</div>
          </Card>
        </div>

        {stats?.stats.weekly_data && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">This Week</h3>
            <div className="flex gap-1">
              {stats.stats.weekly_data.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <div className={`h-10 rounded-lg flex items-center justify-center ${day.mood ? moodEmojis[day.mood]?.color || 'bg-gray-100' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {day.mood ? moodEmojis[day.mood].emoji : ''}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={() => setShowForm(!showForm)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'Log Mood'}
        </Button>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">How are you feeling?</label>
              <div className="grid grid-cols-6 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`p-3 rounded-lg text-2xl transition-all ${
                      selectedMood === mood
                        ? 'ring-2 ring-blue-500 scale-110'
                        : 'hover:scale-105'
                    } ${moodEmojis[mood]?.color}`}
                  >
                    {moodEmojis[mood]?.emoji}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Add a note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button type="submit" disabled={!selectedMood || createEntry.isPending} className="w-full">
              {createEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Mood
            </Button>
          </form>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-4">Recent Entries</h2>
        <div className="space-y-3">
          {entries?.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${moodEmojis[entry.mood]?.color || 'bg-gray-100'}`}>
                {moodEmojis[entry.mood]?.emoji || '😐'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{moodEmojis[entry.mood]?.label || entry.mood}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                {entry.note && <p className="text-sm text-gray-500 mt-1">{entry.note}</p>}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteEntry.mutate(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(!entries || entries.length === 0) && (
            <p className="text-center text-gray-500 py-4">No mood entries yet. Start tracking your mood!</p>
          )}
        </div>
      </Card>
    </div>
  )
}
