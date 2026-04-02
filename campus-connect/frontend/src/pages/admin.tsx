import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, AlertTriangle, Check, X, Trash2, Lock } from 'lucide-react'
import { toast } from 'sonner'

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

export function AdminPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'delete-requests' | 'users' | 'posts'>('delete-requests')

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

  const { data: deleteRequests, isLoading } = useQuery({
    queryKey: ['delete-requests'],
    queryFn: async () => {
      const response = await api.get<DeleteRequest[]>('/posts/delete-requests')
      return response.data
    },
  })

  const handleAction = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) => {
      const response = await api.put(`/posts/delete-requests/${requestId}?action=${action}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Request processed successfully')
      queryClient.invalidateQueries({ queryKey: ['delete-requests'] })
    },
    onError: () => {
      toast.error('Failed to process request')
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <div className="flex gap-2 mb-6">
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
      </div>

      {activeTab === 'delete-requests' && (
        <div className="space-y-4">
          {isLoading ? (
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
                        onClick={() => handleAction.mutate({ requestId: request.id, action: 'approved' })}
                        disabled={handleAction.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction.mutate({ requestId: request.id, action: 'rejected' })}
                        disabled={handleAction.isPending}
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
    </div>
  )
}
