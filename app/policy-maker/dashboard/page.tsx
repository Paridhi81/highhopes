import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default async function PolicyMakerDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/role-selection")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/role-selection")
  }

  // Fetch dashboard data
  const { data: projects } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

  const { data: samples } = await supabase.from("water_samples").select("*").order("created_at", { ascending: false })

  const { data: hmpiCalculations } = await supabase
    .from("hmpi_calculations")
    .select("*")
    .order("calculated_at", { ascending: false })

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("is_resolved", false)
    .order("created_at", { ascending: false })

  // Calculate policy-focused statistics
  const totalProjects = projects?.length || 0
  const totalSamples = samples?.length || 0
  const analyzedSamples = hmpiCalculations?.length || 0
  const criticalAlerts = alerts?.filter((a) => a.severity === "critical").length || 0
  const highRiskSites = hmpiCalculations?.filter((calc) => calc.hmpi_value > 150).length || 0
  const complianceRate = analyzedSamples > 0 ? ((analyzedSamples - highRiskSites) / analyzedSamples) * 100 : 0

  // Regional analysis
  const projectsByRegion =
    projects?.reduce((acc: any, project) => {
      const region = project.location.split(",")[0] || "Unknown"
      acc[region] = (acc[region] || 0) + 1
      return acc
    }, {}) || {}

  const recentAlerts = alerts?.slice(0, 5) || []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome, {profile.full_name}! Strategic overview of groundwater quality and regulatory compliance.
          </p>
        </div>
        <Link href="/policy-maker/compliance">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Generate Compliance Report
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">TOTAL PROJECTS</CardTitle>
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Active monitoring regions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">COMPLIANCE RATE</CardTitle>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{complianceRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Sites within acceptable limits</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">HIGH RISK SITES</CardTitle>
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{highRiskSites}</div>
            <p className="text-xs text-gray-500 mt-1">Require immediate intervention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CRITICAL ALERTS</CardTitle>
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5 5v-5zM12 17.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{criticalAlerts}</div>
            <p className="text-xs text-gray-500 mt-1">Requiring policy action</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Regional Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Regional Distribution</CardTitle>
            <CardDescription>Projects by geographic region</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(projectsByRegion).map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">{region}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count} projects</span>
                    <Progress value={((count as number) / totalProjects) * 100} className="w-16 h-2" />
                  </div>
                </div>
              ))}
              {Object.keys(projectsByRegion).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No regional data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Policy Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Policy Actions</CardTitle>
            <CardDescription>Strategic tools and configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/policy-maker/thresholds">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Configure Safety Thresholds
                </Button>
              </Link>
              <Link href="/policy-maker/policy-config">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Policy Configuration
                </Button>
              </Link>
              <Link href="/policy-maker/analytics">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Strategic Analytics
                </Button>
              </Link>
              <Link href="/policy-maker/regional">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  Regional Overview
                </Button>
              </Link>
              <Link href="/policy-maker/reports">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Generate Policy Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Critical Alerts */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Critical Policy Alerts
              </CardTitle>
              <CardDescription>High-priority issues requiring immediate policy attention</CardDescription>
            </div>
            <Link href="/policy-maker/compliance">
              <Button size="sm" variant="outline">
                View All Alerts
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.severity === "critical"
                      ? "bg-red-50 border-red-200"
                      : alert.severity === "high"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        alert.severity === "critical"
                          ? "bg-red-500"
                          : alert.severity === "high"
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                      }`}
                    ></div>
                    <div>
                      <p
                        className={`font-medium ${
                          alert.severity === "critical"
                            ? "text-red-900"
                            : alert.severity === "high"
                              ? "text-orange-900"
                              : "text-yellow-900"
                        }`}
                      >
                        {alert.message}
                      </p>
                      <p
                        className={`text-sm ${
                          alert.severity === "critical"
                            ? "text-red-600"
                            : alert.severity === "high"
                              ? "text-orange-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {new Date(alert.created_at).toLocaleDateString()} - {alert.alert_type}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={alert.severity === "critical" ? "destructive" : "secondary"}
                    className={
                      alert.severity === "critical"
                        ? ""
                        : alert.severity === "high"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-green-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Critical Alerts</h3>
              <p className="text-gray-500">All monitored regions are within acceptable policy thresholds</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Compliance Summary</CardTitle>
            <CardDescription>Overall regulatory compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Compliance Rate</span>
                <span className="text-lg font-bold text-green-600">{complianceRate.toFixed(1)}%</span>
              </div>
              <Progress value={complianceRate} className="h-3" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-800">{analyzedSamples - highRiskSites}</div>
                  <div className="text-green-600">Compliant Sites</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="font-semibold text-red-800">{highRiskSites}</div>
                  <div className="text-red-600">Non-Compliant Sites</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monitoring Coverage</CardTitle>
            <CardDescription>Data collection and analysis coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Analysis Coverage</span>
                <span className="text-lg font-bold text-blue-600">
                  {totalSamples > 0 ? ((analyzedSamples / totalSamples) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <Progress value={totalSamples > 0 ? (analyzedSamples / totalSamples) * 100 : 0} className="h-3" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-800">{analyzedSamples}</div>
                  <div className="text-blue-600">Analyzed Samples</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">{totalSamples - analyzedSamples}</div>
                  <div className="text-gray-600">Pending Analysis</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
