import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, AlertTriangle, Check, X, Trash2, Lock, Users, FileText, Search, Ban, Shield, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

interface DeleteRequest {
  id: string
  post_id: string
  post_content: string
  user_id: string
  username: string
  reason: string
  status: string
  created_at: string
}

interface ManagedUser {
  id: string
  username: string
  email: string
  avatar_url: string | null
  is_verified: boolean
  is_active: boolean
  role: string
  posts_count: number
  followers_count: number
  following_count: number
  created_at: string
}

interface ContentReport {
  id: string
  reporter_id: string
  reporter_username: string
  reported_user_id: string | null
  reported_user_username: string | null
  reported_post_id: string | null
  reported_post_content: string | null
  reason: string
  details: string | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  resolution_notes: string | null
  created_at: string
}

interface AdminStats {
  total_users: number
  total_posts: number
  pending_reports: number
  pending_delete_requests: number
}

export function AdminPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'delete-requests' | 'users' | 'reports'>('delete-requests')
  const [userSearch, setUserSearch] = useState('')
  const [reportStatus, setReportStatus] = useState<string>('pending')

  const { data: deleteRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['delete-requests'],
    queryFn: async () => {
      const response = await api.get<DeleteRequest[]>('/posts/delete-requests')
      return response.data
    },
  })

  const { data: managedUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (userSearch) params.append('search', userSearch)
      const response = await api.get<ManagedUser[]>(`/admin/users?${params}`)
      return response.data
    },
  })

  const { data: contentReports, isLoading: loadingReports } = useQuery({
    queryKey: ['content-reports', reportStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (reportStatus !== 'all') params.append('status', reportStatus)
      const response = await api.get<ContentReport[]>(`/admin/reports?${params}`)
      return response.data
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get<AdminStats>('/admin/stats')
      return response.data
    },
  })

  const handleDeleteAction = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) => {
      const response = await api.put(`/posts/delete-requests/${requestId}?action=${action}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Request processed successfully')
      queryClient.invalidateQueries({ queryKey: ['delete-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => {
      toast.error('Failed to process request')
    },
  })

  const suspendUser = useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      await api.put(`/admin/users/${userId}/suspend?suspend=${suspend}`)
    },
    onSuccess: (_, variables) => {
      toast.success(`User ${variables.suspend ? 'suspended' : 'unsuspended'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      toast.error('Failed to update user')
    },
  })

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.put(`/admin/users/${userId}/role?role=${role}`)
    },
    onSuccess: () => {
      toast.success('User role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => {
      toast.error('Failed to update user role')
    },
  })

  const updateReport = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: string; notes?: string }) => {
      await api.put(`/admin/reports/${reportId}?status=${status}`, { resolution_notes: notes })
    },
    onSuccess: () => {
      toast.success('Report updated successfully')
      queryClient.invalidateQueries({ queryKey: ['content-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => {
      toast.error('Failed to update report')
    },
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <div className="h-16 w-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.total_users}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.total_posts}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.pending_reports}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pending Reports</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.pending_delete_requests}</span>
            </div>
            <p className="text-sm text-muted-foreground">Delete Requests</p>
          </Card>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={activeTab === 'delete-requests' ? 'default' : 'outline'}
          onClick={() => setActiveTab('delete-requests')}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Requests
          {deleteRequests && deleteRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {deleteRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          User Management
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'default' : 'outline'}
          onClick={() => setActiveTab('reports')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Content Reports
          {contentReports && contentReports.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {contentReports.filter(r => r.status === 'pending').length}
            </span>
          )}
        </Button>
      </div>

      {activeTab === 'delete-requests' && (
        <div className="space-y-4">
          {loadingRequests ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : deleteRequests && deleteRequests.length > 0 ? (
            deleteRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">@{request.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        request.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : request.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      "{request.post_content}..."
                    </p>
                    {request.reason && (
                      <p className="text-xs text-gray-500 mb-2">
                        Reason: {request.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleDeleteAction.mutate({ requestId: request.id, action: 'approved' })}
                        disabled={handleDeleteAction.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAction.mutate({ requestId: request.id, action: 'rejected' })}
                        disabled={handleDeleteAction.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <Trash2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No delete requests</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : managedUsers && managedUsers.length > 0 ? (
            <div className="space-y-2">
              {managedUsers.map((u) => (
                <Card key={u.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{u.username}</span>
                          {u.is_verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>{u.posts_count} posts</span>
                          <span>{u.followers_count} followers</span>
                          <span>{u.following_count} following</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newRole = u.role === 'admin' ? 'user' : 'admin'
                          updateUserRole.mutate({ userId: u.id, role: newRole })
                        }}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.is_active ? 'destructive' : 'outline'}
                        onClick={() => suspendUser.mutate({ userId: u.id, suspend: !u.is_active })}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        {u.is_active ? 'Suspend' : 'Unsuspend'}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/profile/${u.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No users found</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['all', 'pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={reportStatus === status ? 'default' : 'outline'}
                onClick={() => setReportStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
          
          {loadingReports ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : contentReports && contentReports.length > 0 ? (
            contentReports.map((report) => (
              <Card key={report.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Reported by: @{report.reporter_username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        report.status === 'reviewing' ? 'bg-blue-100 text-blue-700' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    {report.reported_user_username && (
                      <p className="text-sm mb-1">Reported user: <span className="font-medium">@{report.reported_user_username}</span></p>
                    )}
                    {report.reported_post_content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Post: "{report.reported_post_content}..."
                      </p>
                    )}
                    <div className="bg-muted p-2 rounded mb-2">
                      <p className="text-sm font-medium">Reason: {report.reason}</p>
                      {report.details && <p className="text-xs text-muted-foreground mt-1">{report.details}</p>}
                    </div>
                    {report.resolution_notes && (
                      <p className="text-sm text-green-600 mt-2">
                        Resolution: {report.resolution_notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                  
                  {report.status === 'pending' && (
                    <div className="flex gap-2 ml-4 flex-col">
                      <Button
                        size="sm"
                        onClick={() => updateReport.mutate({ reportId: report.id, status: 'reviewing' })}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateReport.mutate({ reportId: report.id, status: 'dismissed' })}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                  
                  {report.status === 'reviewing' && (
                    <div className="flex gap-2 ml-4 flex-col">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => updateReport.mutate({ reportId: report.id, status: 'resolved', notes: 'Issue addressed' })}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReport.mutate({ reportId: report.id, status: 'dismissed' })}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No reports found</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
