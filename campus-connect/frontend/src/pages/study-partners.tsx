import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useStudyPartnerRequests, useMyStudyRequests, useMyStudyMatches, useCreateStudyRequest, useDeleteStudyRequest, useCreateStudyMatch } from '@/hooks/use-study-partner'
import { Loader2, Search, Plus, Trash2, Users, BookOpen, Video, MapPin, UserPlus, MessageCircle } from 'lucide-react'

export function StudyPartnersPage() {
  const [activeTab, setActiveTab] = useState<'find' | 'my-requests' | 'matches'>('find')
  const [searchFilters, setSearchFilters] = useState({ course: '', topic: '', preferred_method: '' })
  const [showForm, setShowForm] = useState(false)

  const { data: requests, isLoading } = useStudyPartnerRequests(activeTab === 'find' ? searchFilters : undefined)
  const { data: myRequests } = useMyStudyRequests()
  const { data: matches } = useMyStudyMatches()
  const createRequest = useCreateStudyRequest()
  const deleteRequest = useDeleteStudyRequest()
  const createMatch = useCreateStudyMatch()

  const [formData, setFormData] = useState({
    course: '',
    topic: '',
    description: '',
    preferred_method: 'both',
    availability: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createRequest.mutateAsync(formData)
    setShowForm(false)
    setFormData({ course: '', topic: '', description: '', preferred_method: 'both', availability: '' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-4">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-500" />
          Study Partners
        </h1>

        <div className="flex gap-2 border-b mb-4">
          <button
            onClick={() => setActiveTab('find')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'find' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            Find Partners
          </button>
          <button
            onClick={() => setActiveTab('my-requests')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'my-requests' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'matches' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            Matches
          </button>
        </div>

        {activeTab === 'find' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Course (e.g., CS101)"
                  value={searchFilters.course}
                  onChange={(e) => setSearchFilters({ ...searchFilters, course: e.target.value })}
                  className="pl-10"
                />
              </div>
              <select
                value={searchFilters.preferred_method}
                onChange={(e) => setSearchFilters({ ...searchFilters, preferred_method: e.target.value })}
                className="px-3 rounded-lg border"
              >
                <option value="">Method</option>
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="both">Both</option>
              </select>
            </div>

            <Button onClick={() => setShowForm(!showForm)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Request
            </Button>

            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg">
                <Input
                  placeholder="Course *"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                />
                <Input
                  placeholder="Topic (e.g., Algorithms)"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <select
                  value={formData.preferred_method}
                  onChange={(e) => setFormData({ ...formData, preferred_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                >
                  <option value="both">Online or In-Person</option>
                  <option value="online">Online</option>
                  <option value="in-person">In-Person</option>
                </select>
                <Input
                  placeholder="Availability"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                />
                <Button type="submit" disabled={createRequest.isPending} className="w-full">
                  {createRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Post Request
                </Button>
              </form>
            )}

            <div className="space-y-3">
              {requests?.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{request.course}</div>
                      {request.topic && <div className="text-sm text-gray-500">{request.topic}</div>}
                      {request.description && <p className="text-sm mt-2">{request.description}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        {request.preferred_method === 'online' && <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Online</span>}
                        {request.preferred_method === 'in-person' && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> In-Person</span>}
                        {request.preferred_method === 'both' && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Both</span>}
                        {request.availability && <span>{request.availability}</span>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => createMatch.mutate(request.id)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    by {request.user_username}
                  </div>
                </Card>
              ))}
              {(!requests || requests.length === 0) && (
                <p className="text-center text-gray-500 py-4">No requests found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'my-requests' && (
          <div className="space-y-3">
            {myRequests?.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{request.course}</div>
                    {request.topic && <div className="text-sm text-gray-500">{request.topic}</div>}
                    <div className="text-xs mt-2 text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => deleteRequest.mutate(request.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {(!myRequests || myRequests.length === 0) && (
              <p className="text-center text-gray-500 py-4">No requests yet</p>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-3">
            {matches?.map((match) => (
              <Card key={match.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    {match.matched_username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{match.matched_username}</div>
                    <div className="text-sm text-gray-500">{match.matched_course}</div>
                  </div>
                </div>
                <Button className="w-full mt-3" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </Card>
            ))}
            {(!matches || matches.length === 0) && (
              <p className="text-center text-gray-500 py-4">No matches yet</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
