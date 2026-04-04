import { useRequestExport, useExportStatus, useExportData } from '@/hooks/use-activity-export'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Download, FileText, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function ExportPage() {
  const requestExport = useRequestExport()
  const { data: status, isLoading: loadingStatus } = useExportStatus()
  const { data: exportData, isLoading: loadingData } = useExportData()

  const handleRequestExport = () => {
    requestExport.mutate(undefined, {
      onSuccess: () => {
        toast.success('Export request submitted. This may take a few minutes.')
      },
      onError: () => {
        toast.error('Failed to request export')
      },
    })
  }

  const handleDownload = () => {
    if (exportData) {
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `campus-connect-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Export downloaded!')
    }
  }

  const getStatusIcon = () => {
    if (!status) return null
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    if (!status) return 'Unknown'
    switch (status.status) {
      case 'pending':
        return 'Queued for processing...'
      case 'processing':
        return 'Processing your data...'
      case 'completed':
        return 'Export ready!'
      case 'failed':
        return 'Export failed. Please try again.'
      default:
        return status.status
    }
  }

  if (loadingStatus) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Database className="h-6 w-6" />
        Data Export
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GDPR Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Request a full export of your data. This includes your profile information, posts, comments, likes, follows, messages, and notifications. The export will be available as a JSON file.
          </p>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            {getStatusIcon()}
            <div>
              <p className="font-medium">{getStatusText()}</p>
              {status?.requested_at && (
                <p className="text-xs text-muted-foreground">
                  Requested: {new Date(status.requested_at).toLocaleString()}
                </p>
              )}
              {status?.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Completed: {new Date(status.completed_at).toLocaleString()}
                </p>
              )}
              {status?.expires_at && status.status === 'completed' && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(status.expires_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {(status?.status === 'pending' || status?.status === 'processing') ? (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </Button>
            ) : (
              <Button onClick={handleRequestExport} disabled={requestExport.isPending}>
                {requestExport.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Request Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Download your data immediately without waiting for processing.
          </p>
          {loadingData ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : exportData ? (
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Now
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load data</p>
          )}
        </CardContent>
      </Card>

      {exportData && (
        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{exportData.posts.length}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{exportData.comments.length}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{exportData.likes.length}</p>
                <p className="text-xs text-muted-foreground">Likes</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{exportData.follows.length}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
