"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Clock, MapPin } from "lucide-react"

interface Alert {
  id: string
  project_name: string
  location: string
  alert_type: string
  severity: string
  message: string
  created_at: string
  resolved: boolean
  hmpi_value?: number
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("alerts")
        .select(`
          id,
          alert_type,
          severity,
          message,
          created_at,
          resolved,
          projects (
            name,
            location
          ),
          water_samples (
            hmpi_calculations (
              hmpi_value
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedAlerts: Alert[] =
        data?.map((alert) => ({
          id: alert.id,
          project_name: alert.projects?.name || "Unknown Project",
          location: alert.projects?.location || "Unknown Location",
          alert_type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          created_at: alert.created_at,
          resolved: alert.resolved,
          hmpi_value: alert.water_samples?.[0]?.hmpi_calculations?.[0]?.hmpi_value,
        })) || []

      setAlerts(formattedAlerts)
    } catch (error) {
      console.error("Error fetching alerts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resolveAlert = async (alertId: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", alertId)

      if (error) throw error

      setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert)))
    } catch (error) {
      console.error("Error resolving alert:", error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "medium":
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <CheckCircle className="h-5 w-5 text-blue-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading alerts...</p>
          </div>
        </div>
      </div>
    )
  }

  const activeAlerts = alerts.filter((alert) => !alert.resolved)
  const resolvedAlerts = alerts.filter((alert) => alert.resolved)

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Alerts</h1>
            <p className="text-gray-600 mt-1">Monitor and manage water quality alerts</p>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">
                {activeAlerts.filter((a) => a.severity === "critical").length}
              </div>
              <p className="text-sm text-gray-600">Critical Alerts</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">
                {activeAlerts.filter((a) => a.severity === "high").length}
              </div>
              <p className="text-sm text-gray-600">High Priority</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {activeAlerts.filter((a) => a.severity === "medium").length}
              </div>
              <p className="text-sm text-gray-600">Medium Priority</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</div>
              <p className="text-sm text-gray-600">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Active Alerts ({activeAlerts.length})</span>
            </CardTitle>
            <CardDescription>Alerts requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No active alerts - All systems normal</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{alert.project_name}</h3>
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                            <Badge variant="outline">{alert.alert_type}</Badge>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span>{alert.location}</span>
                            <span>•</span>
                            <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                            {alert.hmpi_value && (
                              <>
                                <span>•</span>
                                <span>HMPI: {alert.hmpi_value.toFixed(1)}</span>
                              </>
                            )}
                          </div>
                          <p className="text-gray-700">{alert.message}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Resolved Alerts ({resolvedAlerts.length})</span>
              </CardTitle>
              <CardDescription>Recently resolved alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resolvedAlerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 bg-gray-50 opacity-75">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-700">{alert.project_name}</h3>
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            RESOLVED
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <MapPin className="h-4 w-4" />
                          <span>{alert.location}</span>
                          <span>•</span>
                          <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
