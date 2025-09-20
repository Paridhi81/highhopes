"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface TrendData {
  date: string
  hmpi: number
  ph: number
  turbidity: number
  dissolved_oxygen: number
  temperature: number
  conductivity: number
  project: string
  location: string
}

export default function TrendsPage() {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedParameter, setSelectedParameter] = useState<string>("hmpi")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("30")
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    fetchTrendData()
  }, [selectedProject, selectedTimeframe])

  const fetchTrendData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - Number.parseInt(selectedTimeframe))

      // Fetch projects and samples
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
              calculated_at
            )
          )
        `,
        )
        .gte("water_samples.collected_at", startDate.toISOString())
        .lte("water_samples.collected_at", endDate.toISOString())
        .order("water_samples.collected_at", { ascending: true })

      if (selectedProject !== "all") {
        query = query.eq("id", selectedProject)
      }

      const { data: projectData } = await query

      if (projectData) {
        setProjects(projectData)

        const trends: TrendData[] = []
        projectData.forEach((project) => {
          project.water_samples.forEach((sample: any) => {
            if (sample.hmpi_calculations.length > 0) {
              trends.push({
                date: new Date(sample.collected_at).toLocaleDateString(),
                hmpi: sample.hmpi_calculations[0].hmpi_value,
                ph: sample.ph || 0,
                turbidity: sample.turbidity || 0,
                dissolved_oxygen: sample.dissolved_oxygen || 0,
                temperature: sample.temperature || 0,
                conductivity: sample.conductivity || 0,
                project: project.name,
                location: project.location,
              })
            }
          })
        })

        setTrendData(trends)
      }
    } catch (error) {
      console.error("Error fetching trend data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate correlation data
  const correlationData = trendData.map((item) => ({
    hmpi: item.hmpi,
    ph: item.ph,
    turbidity: item.turbidity,
    dissolved_oxygen: item.dissolved_oxygen,
    temperature: item.temperature,
    conductivity: item.conductivity,
  }))

  // Calculate seasonal patterns
  const seasonalData = trendData.reduce((acc: any, item) => {
    const month = new Date(item.date).getMonth()
    const season = month < 3 || month >= 11 ? "Winter" : month < 6 ? "Spring" : month < 9 ? "Summer" : "Autumn"

    if (!acc[season]) {
      acc[season] = { season, hmpi: [], count: 0 }
    }
    acc[season].hmpi.push(item.hmpi)
    acc[season].count++
    return acc
  }, {})

  const seasonalChartData = Object.values(seasonalData).map((season: any) => ({
    season: season.season,
    avgHMPI: season.hmpi.reduce((a: number, b: number) => a + b, 0) / season.hmpi.length,
    samples: season.count,
  }))

  // Calculate parameter distribution
  const parameterDistribution = [
    { name: "Excellent (0-50)", value: trendData.filter((d) => d.hmpi <= 50).length, color: "#10b981" },
    { name: "Good (51-100)", value: trendData.filter((d) => d.hmpi > 50 && d.hmpi <= 100).length, color: "#3b82f6" },
    {
      name: "Moderate (101-200)",
      value: trendData.filter((d) => d.hmpi > 100 && d.hmpi <= 200).length,
      color: "#f59e0b",
    },
    { name: "Poor (201-300)", value: trendData.filter((d) => d.hmpi > 200 && d.hmpi <= 300).length, color: "#ef4444" },
    { name: "Very Poor (>300)", value: trendData.filter((d) => d.hmpi > 300).length, color: "#7c2d12" },
  ]

  const getParameterLabel = (param: string) => {
    const labels: { [key: string]: string } = {
      hmpi: "HMPI Value",
      ph: "pH Level",
      turbidity: "Turbidity (NTU)",
      dissolved_oxygen: "Dissolved Oxygen (mg/L)",
      temperature: "Temperature (°C)",
      conductivity: "Conductivity (μS/cm)",
    }
    return labels[param] || param
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing trends...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Trend Analysis</h1>
            <p className="text-gray-600 mt-1">Advanced statistical analysis of water quality trends and patterns</p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analysis Configuration</CardTitle>
            <CardDescription>Configure parameters for trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Parameter</label>
                <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parameter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hmpi">HMPI Value</SelectItem>
                    <SelectItem value="ph">pH Level</SelectItem>
                    <SelectItem value="turbidity">Turbidity</SelectItem>
                    <SelectItem value="dissolved_oxygen">Dissolved Oxygen</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="conductivity">Conductivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Parameter Trend Over Time</CardTitle>
            <CardDescription>
              Temporal analysis of {getParameterLabel(selectedParameter)} across selected projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={selectedParameter}
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ fill: "#0d9488", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Seasonal Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns</CardTitle>
              <CardDescription>HMPI variations across different seasons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgHMPI" fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quality Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Water Quality Distribution</CardTitle>
              <CardDescription>Distribution of samples across quality categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={parameterDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {parameterDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Correlation Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Parameter Correlation Analysis</CardTitle>
            <CardDescription>Relationship between HMPI and other water quality parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-4">HMPI vs pH</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={correlationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ph" name="pH" />
                      <YAxis dataKey="hmpi" name="HMPI" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Scatter dataKey="hmpi" fill="#0d9488" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4">HMPI vs Turbidity</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={correlationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="turbidity" name="Turbidity" />
                      <YAxis dataKey="hmpi" name="HMPI" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Scatter dataKey="hmpi" fill="#f59e0b" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistical Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Statistical Summary</CardTitle>
            <CardDescription>Key statistical insights from the trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">
                  {trendData.length > 0
                    ? (trendData.reduce((sum, d) => sum + d.hmpi, 0) / trendData.length).toFixed(1)
                    : "0"}
                </div>
                <p className="text-sm text-teal-700">Average HMPI</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {trendData.length > 0 ? Math.max(...trendData.map((d) => d.hmpi)).toFixed(1) : "0"}
                </div>
                <p className="text-sm text-blue-700">Maximum HMPI</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {trendData.length > 0 ? Math.min(...trendData.map((d) => d.hmpi)).toFixed(1) : "0"}
                </div>
                <p className="text-sm text-green-700">Minimum HMPI</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Trend Insights</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Data Points:</span>
                    <span className="font-medium">{trendData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects Analyzed:</span>
                    <span className="font-medium">{new Set(trendData.map((d) => d.project)).size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Span:</span>
                    <span className="font-medium">{selectedTimeframe} days</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Quality Assessment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Excellent Quality:</span>
                    <span className="font-medium text-green-600">
                      {trendData.filter((d) => d.hmpi <= 50).length} samples
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Poor Quality:</span>
                    <span className="font-medium text-red-600">
                      {trendData.filter((d) => d.hmpi > 200).length} samples
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Improvement Needed:</span>
                    <span className="font-medium text-orange-600">
                      {((trendData.filter((d) => d.hmpi > 100).length / trendData.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
