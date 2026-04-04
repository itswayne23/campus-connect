import { useState } from 'react'
import { useEvents, useCreateEvent, useUpdateRSVP } from '@/hooks/use-engagement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Calendar, MapPin, Users, Clock, Plus, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const eventTypes = [
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social' },
  { value: 'sports', label: 'Sports' },
  { value: 'career', label: 'Career' },
  { value: 'cultural', label: 'Cultural' },
]

export function EventsPage() {
  const [eventType, setEventType] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [type, setType] = useState('general')

  const { data: events, isLoading } = useEvents(eventType || undefined, true)
  const createEvent = useCreateEvent()
  const updateRSVP = useUpdateRSVP()

  const handleCreate = () => {
    if (!title.trim() || !startDate) {
      toast.error('Please fill in required fields')
      return
    }
    createEvent.mutate(
      {
        title,
        description,
        location,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        event_type: type,
      },
      {
        onSuccess: () => {
          setShowCreate(false)
          setTitle('')
          setDescription('')
          setLocation('')
          setStartDate('')
          setEndDate('')
        },
      }
    )
  }

  const handleRSVP = (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    updateRSVP.mutate({ eventId, status })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Campus Events
        </h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this event about?"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where will it be held?"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start *</label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End</label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Event Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-md border bg-background"
                >
                  {eventTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createEvent.isPending}>
                  {createEvent.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!eventType ? 'default' : 'outline'}
          size="sm"
          onClick={() => setEventType('')}
        >
          All
        </Button>
        {eventTypes.map((t) => (
          <Button
            key={t.value}
            variant={eventType === t.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEventType(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {!events?.length ? (
        <Card className="p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
          <p className="text-muted-foreground mb-4">Create the first campus event!</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.event_type === 'academic' ? 'bg-blue-100 text-blue-700' :
                        event.event_type === 'social' ? 'bg-green-100 text-green-700' :
                        event.event_type === 'sports' ? 'bg-orange-100 text-orange-700' :
                        event.event_type === 'career' ? 'bg-purple-100 text-purple-700' :
                        event.event_type === 'cultural' ? 'bg-pink-100 text-pink-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {event.event_type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(event.start_date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.attendees_count} attending
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant={event.user_rsvp === 'going' ? 'default' : 'outline'}
                      onClick={() => handleRSVP(event.id, 'going')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Going
                    </Button>
                    <Button
                      size="sm"
                      variant={event.user_rsvp === 'maybe' ? 'secondary' : 'outline'}
                      onClick={() => handleRSVP(event.id, 'maybe')}
                    >
                      Maybe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
