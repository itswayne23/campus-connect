import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSearchProfessors, useProfessorRatings, useProfessorStats, useCreateProfessorRating, useUpvoteProfessorRating } from '@/hooks/use-professor'
import { useSearchCourses, useCourseReviews, useCourseStats, useCreateCourseReview, useUpvoteCourseReview } from '@/hooks/use-course-review'
import { Star, Search, ThumbsUp, GraduationCap, Users, BookOpen, Filter } from 'lucide-react'

type Tab = 'professors' | 'courses'

const moodEmojis = ['😊', '😢', '😰', '🤩', '😴', '😐']

export function AcademicsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('professors')
  const [professorSearch, setProfessorSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-4">
        <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Academics
        </h1>
        
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('professors')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'professors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Professors
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'courses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            <BookOpen className="h-4 w-4 inline-block mr-2" />
            Courses
          </button>
        </div>

        {activeTab === 'professors' ? (
          <ProfessorSection
            search={professorSearch}
            setSearch={setProfessorSearch}
            selected={selectedProfessor}
            setSelected={setSelectedProfessor}
          />
        ) : (
          <CourseSection
            search={courseSearch}
            setSearch={setCourseSearch}
            selected={selectedCourse}
            setSelected={setSelectedCourse}
          />
        )}
      </Card>
    </div>
  )
}

function ProfessorSection({ search, setSearch, selected, setSelected }: {
  search: string
  setSearch: (s: string) => void
  selected: string | null
  setSelected: (s: string | null) => void
}) {
  const { data: searchResults } = useSearchProfessors(search)
  const { data: ratings } = useProfessorRatings(selected || '')
  const { data: stats } = useProfessorStats(selected || '')
  const createRating = useCreateProfessorRating()
  const upvoteRating = useUpvoteProfessorRating()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    professor_name: '',
    course_code: '',
    department: '',
    overall_rating: 5,
    difficulty: 3,
    would_take_again: true,
    attendance_mandatory: false,
    grade_type: '',
    comment: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createRating.mutateAsync(formData)
    setShowForm(false)
    setFormData({
      professor_name: '',
      course_code: '',
      department: '',
      overall_rating: 5,
      difficulty: 3,
      would_take_again: true,
      attendance_mandatory: false,
      grade_type: '',
      comment: ''
    })
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search professors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchResults && searchResults.length > 0 && !selected && (
        <div className="border rounded-lg divide-y">
          {searchResults.map((p) => (
            <button
              key={p.professor_name}
              onClick={() => setSelected(p.professor_name)}
              className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="font-medium">{p.professor_name}</div>
              {p.department && <div className="text-sm text-gray-500">{p.department}</div>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelected(null)}>Back</Button>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Add Rating'}
            </Button>
          </div>

          {stats && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{stats.stats.average_rating}</div>
                  <div className="text-sm text-gray-500">Avg Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">{stats.stats.average_difficulty}</div>
                  <div className="text-sm text-gray-500">Difficulty</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">{stats.stats.would_take_again_percentage}%</div>
                  <div className="text-sm text-gray-500">Would Take Again</div>
                </div>
                <div>
                  <div className="text-xl font-semibold">{stats.stats.total_ratings}</div>
                  <div className="text-sm text-gray-500">Total Ratings</div>
                </div>
              </div>
            </Card>
          )}

          {showForm && (
            <Card className="p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Professor Name"
                  value={formData.professor_name}
                  onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Course Code (e.g., CS101)"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.overall_rating}
                      onChange={(e) => setFormData({ ...formData, overall_rating: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Difficulty</label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.would_take_again}
                    onChange={(e) => setFormData({ ...formData, would_take_again: e.target.checked })}
                  />
                  Would take again
                </label>
                <Textarea
                  placeholder="Your review..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                />
                <Button type="submit" disabled={createRating.isPending}>
                  Submit Rating
                </Button>
              </form>
            </Card>
          )}

          <div className="space-y-3">
            {ratings?.map((rating) => (
              <Card key={rating.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{rating.course_code}</div>
                    <div className="text-sm text-gray-500">by {rating.user_username}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating.overall_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                {rating.comment && <p className="mt-2 text-sm">{rating.comment}</p>}
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <button
                    onClick={() => upvoteRating.mutate(rating.id)}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {rating.upvotes}
                  </button>
                  <span>Difficulty: {rating.difficulty}/5</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CourseSection({ search, setSearch, selected, setSelected }: {
  search: string
  setSearch: (s: string) => void
  selected: string | null
  setSelected: (s: string | null) => void
}) {
  const { data: searchResults } = useSearchCourses(search)
  const { data: reviews } = useCourseReviews(selected || '')
  const { data: stats } = useCourseStats(selected || '')
  const createReview = useCreateCourseReview()
  const upvoteReview = useUpvoteCourseReview()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    department: '',
    semester: '',
    overall_rating: 5,
    difficulty: 3,
    workload: 3,
    lecture_quality: 5,
    materials_quality: 5,
    comment: '',
    pros: '',
    cons: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createReview.mutateAsync({
      ...formData,
      pros: formData.pros.split(',').map(p => p.trim()).filter(Boolean),
      cons: formData.cons.split(',').map(c => c.trim()).filter(Boolean)
    })
    setShowForm(false)
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchResults && searchResults.length > 0 && !selected && (
        <div className="border rounded-lg divide-y">
          {searchResults.map((c) => (
            <button
              key={c.course_code}
              onClick={() => setSelected(c.course_code)}
              className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="font-medium">{c.course_code}</div>
              <div className="text-sm text-gray-500">{c.course_name}</div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelected(null)}>Back</Button>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Add Review'}
            </Button>
          </div>

          {stats && (
            <Card className="p-4 bg-purple-50 dark:bg-purple-950/30">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.stats.average_overall}</div>
                  <div className="text-sm text-gray-500">Overall</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.stats.average_difficulty}</div>
                  <div className="text-sm text-gray-500">Difficulty</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.stats.average_workload}</div>
                  <div className="text-sm text-gray-500">Workload</div>
                </div>
              </div>
            </Card>
          )}

          {showForm && (
            <Card className="p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Course Code"
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Course Name"
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-1">
                    <label className="text-xs">Overall</label>
                    <Input type="number" min={1} max={5} value={formData.overall_rating} onChange={(e) => setFormData({ ...formData, overall_rating: parseInt(e.target.value) })} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs">Difficulty</label>
                    <Input type="number" min={1} max={5} value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs">Workload</label>
                    <Input type="number" min={1} max={5} value={formData.workload} onChange={(e) => setFormData({ ...formData, workload: parseInt(e.target.value) })} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs">Lecture</label>
                    <Input type="number" min={1} max={5} value={formData.lecture_quality} onChange={(e) => setFormData({ ...formData, lecture_quality: parseInt(e.target.value) })} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs">Materials</label>
                    <Input type="number" min={1} max={5} value={formData.materials_quality} onChange={(e) => setFormData({ ...formData, materials_quality: parseInt(e.target.value) })} />
                  </div>
                </div>
                <Textarea placeholder="Your review..." value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} />
                <Input placeholder="Pros (comma separated)" value={formData.pros} onChange={(e) => setFormData({ ...formData, pros: e.target.value })} />
                <Input placeholder="Cons (comma separated)" value={formData.cons} onChange={(e) => setFormData({ ...formData, cons: e.target.value })} />
                <Button type="submit" disabled={createReview.isPending}>Submit Review</Button>
              </form>
            </Card>
          )}

          <div className="space-y-3">
            {reviews?.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{review.course_code}</div>
                    <div className="text-sm text-gray-500">{review.semester} by {review.user_username}</div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">{review.overall_rating}/5</div>
                </div>
                {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => upvoteReview.mutate(review.id)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                    <ThumbsUp className="h-4 w-4" /> {review.upvotes}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
