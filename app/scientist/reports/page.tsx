"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ReportData {
  project_name: string
  location: string
  sample_count: number
  avg_hmpi: number
  max_hmpi: number
  min_hmpi: number
  contamination_trend: string
  last_updated: string
  parameters_analyzed: string[]
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("30")
  const [isLoading, setIsLoading] = useState(true)
  const [trendData, setTrendData] = useState<any[]>([])

  useEffect(() => {
    fetchReportData()
  }, [selectedProject, selectedTimeframe])

  const fetchReportData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - Number.parseInt(selectedTimeframe))

      // Fetch projects with samples and calculations
      let query = supabase
        .from("projects")
        .select(
          `
          id,
          name,
          location,
          water_samples!inner (
            id,
            collected_at,
            ph,
            turbidity,
            dissolved_oxygen,
            temperature,
            conductivity,
            hmpi_calculations (
              hmpi_value,
              contamination_level,
              calculated_at
            )
          )
        `,
        )
        .gte("water_samples.collected_at", startDate.toISOString())
        .lte("water_samples.collected_at", endDate.toISOString())

      if (selectedProject !== "all") {
        query = query.eq("id", selectedProject)
      }

      const { data: projects } = await query

      if (projects) {
        const reports: ReportData[] = projects.map((project) => {
          const samples = project.water_samples || []
          const calculatedSamples = samples.filter((s: any) => s.hmpi_calculations.length > 0)

          const hmpiValues = calculatedSamples.map((s: any) => s.hmpi_calculations[0]?.hmpi_value || 0)
          const avgHmpi = hmpiValues.length > 0 ? hmpiValues.reduce((a, b) => a + b, 0) / hmpiValues.length : 0
          const maxHmpi = hmpiValues.length > 0 ? Math.max(...hmpiValues) : 0
          const minHmpi = hmpiValues.length > 0 ? Math.min(...hmpiValues) : 0

          // Determine trend
          const recentSamples = calculatedSamples.slice(-5)
          const olderSamples = calculatedSamples.slice(0, 5)
          const recentAvg =
            recentSamples.length > 0
              ? recentSamples.reduce((sum: number, s: any) => sum + (s.hmpi_calculations[0]?.hmpi_value || 0), 0) /
                recentSamples.length
              : 0
          const olderAvg =
            olderSamples.length > 0
              ? olderSamples.reduce((sum: number, s: any) => sum + (s.hmpi_calculations[0]?.hmpi_value || 0), 0) /
                olderSamples.length
              : 0

          let trend = "stable"
          if (recentAvg > olderAvg * 1.1) trend = "increasing"
          else if (recentAvg < olderAvg * 0.9) trend = "decreasing"

          const parametersAnalyzed = []
          if (samples.some((s: any) => s.ph !== null)) parametersAnalyzed.push("pH")
          if (samples.some((s: any) => s.turbidity !== null)) parametersAnalyzed.push("Turbidity")
          if (samples.some((s: any) => s.dissolved_oxygen !== null)) parametersAnalyzed.push("Dissolved Oxygen")
          if (samples.some((s: any) => s.temperature !== null)) parametersAnalyzed.push("Temperature")
          if (samples.some((s: any) => s.conductivity !== null)) parametersAnalyzed.push("Conductivity")

          return {
            project_name: project.name,
            location: project.location,
            sample_count: calculatedSamples.length,
            avg_hmpi: avgHmpi,
            max_hmpi: maxHmpi,
            min_hmpi: minHmpi,
            contamination_trend: trend,
            last_updated:
              calculatedSamples.length > 0
                ? Math.max(
                    ...calculatedSamples.map((s: any) => new Date(s.hmpi_calculations[0]?.calculated_at).getTime()),
                  )
                : 0,
            parameters_analyzed: parametersAnalyzed,
          }
        })

        setReportData(reports)

        // Generate trend data for charts
        const trendChartData = []
        for (
          let i = Number.parseInt(selectedTimeframe);
          i >= 0;
          i -= Math.ceil(Number.parseInt(selectedTimeframe) / 10)
        ) {
          const date = new Date()
          date.setDate(date.getDate() - i)

          const dayData = projects.flatMap((p) =>
            p.water_samples
              .filter((s: any) => {
                const sampleDate = new Date(s.collected_at)
                return sampleDate.toDateString() === date.toDateString() && s.hmpi_calculations.length > 0
              })
              .map((s: any) => s.hmpi_calculations[0]?.hmpi_value || 0),
          )

          if (dayData.length > 0) {
            trendChartData.push({
              date: date.toLocaleDateString(),
              avgHMPI: dayData.reduce((a, b) => a + b, 0) / dayData.length,
              samples: dayData.length,
            })
          }
        }

        setTrendData(trendChartData)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDetailedReport = () => {
    const reportContent = {
      generated_at: new Date().toISOString(),
      timeframe: `${selectedTimeframe} days`,
      project_filter: selectedProject,
      summary: {
        total_projects: reportData.length,
        total_samples: reportData.reduce((sum, r) => sum + r.sample_count, 0),
        average_hmpi:
          reportData.length > 0 ? reportData.reduce((sum, r) => sum + r.avg_hmpi, 0) / reportData.length : 0,
        high_risk_projects: reportData.filter((r) => r.avg_hmpi > 150).length,
      },
      detailed_analysis: reportData,
      trend_data: trendData,
    }

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `water-quality-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Water Quality Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive analysis and reporting of water quality data</p>
          </div>
          <Button onClick={generateDetailedReport} className="bg-teal-600 hover:bg-teal-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Configure the scope and timeframe for your water quality report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Project Filter</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {reportData.map((report, index) => (
                      <SelectItem key={index} value={report.project_name}>
                        {report.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-teal-600">{reportData.length}</div>
              <p className="text-sm text-gray-600">Projects Analyzed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">
                {reportData.reduce((sum, r) => sum + r.sample_count, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Samples</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {reportData.length > 0
                  ? (reportData.reduce((sum, r) => sum + r.avg_hmpi, 0) / reportData.length).toFixed(1)
                  : "0"}
              </div>
              <p className="text-sm text-gray-600">Average HMPI</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{reportData.filter((r) => r.avg_hmpi > 150).length}</div>
              <p className="text-sm text-gray-600">High Risk Sites</p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>HMPI Trend Analysis</CardTitle>
            <CardDescription>Water quality trends over the selected time period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgHMPI" stroke="#0d9488" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Project Analysis</CardTitle>
            <CardDescription>Comprehensive breakdown of water quality metrics by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Project</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Samples</th>
                    <th className="text-left p-3">Avg HMPI</th>
                    <th className="text-left p-3">Range</th>
                    <th className="text-left p-3">Trend</th>
                    <th className="text-left p-3">Parameters</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((report, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{report.project_name}</td>
                      <td className="p-3">{report.location}</td>
                      <td className="p-3">{report.sample_count}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{report.avg_hmpi.toFixed(1)}</span>
                          <div className="w-16">
                            <Progress value={Math.min((report.avg_hmpi / 300) * 100, 100)} className="h-2" />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        {report.min_hmpi.toFixed(1)} - {report.max_hmpi.toFixed(1)}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            report.contamination_trend === "increasing"
                              ? "bg-red-100 text-red-800"
                              : report.contamination_trend === "decreasing"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {report.contamination_trend}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {report.parameters_analyzed.slice(0, 3).map((param) => (
                            <Badge key={param} variant="outline" className="text-xs">
                              {param}
                            </Badge>
                          ))}
                          {report.parameters_analyzed.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{report.parameters_analyzed.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            report.avg_hmpi <= 100
                              ? "bg-green-100 text-green-800"
                              : report.avg_hmpi <= 200
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {report.avg_hmpi <= 100 ? "Good" : report.avg_hmpi <= 200 ? "Moderate" : "Poor"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data available for the selected criteria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
