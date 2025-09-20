"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, BarChart3 } from "lucide-react"
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

interface Project {
  id: string
  name: string
  location: string
}

interface VisualizationData {
  date: string
  hmpi_value: number
  ph: number
  temperature: number
  location: string
  contamination_level: string
}

export default function ResearcherVisualizationPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [visualizationData, setVisualizationData] = useState<VisualizationData[]>([])
  const [chartType, setChartType] = useState<string>("line")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchVisualizationData(selectedProject)
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("projects").select("id, name, location")
    if (data) {
      setProjects(data)
      if (data.length > 0) {
        setSelectedProject(data[0].id)
      }
    }
    setIsLoading(false)
  }

  const fetchVisualizationData = async (projectId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("water_samples")
      .select(`
        collected_at,
        ph,
        temperature,
        location,
        hmpi_calculations (
          hmpi_value,
          contamination_level
        )
      `)
      .eq("project_id", projectId)
      .order("collected_at", { ascending: true })

    if (data) {
      const formattedData: VisualizationData[] = data
        .filter((sample) => sample.hmpi_calculations.length > 0)
        .map((sample) => ({
          date: new Date(sample.collected_at).toLocaleDateString(),
          hmpi_value: sample.hmpi_calculations[0].hmpi_value,
          ph: sample.ph,
          temperature: sample.temperature,
          location: sample.location,
          contamination_level: sample.hmpi_calculations[0].contamination_level,
        }))
      setVisualizationData(formattedData)
    }
  }

  const getContaminationColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "safe":
        return "#10b981"
      case "moderate":
        return "#f59e0b"
      case "high":
        return "#ef4444"
      case "critical":
        return "#7f1d1d"
      default:
        return "#6b7280"
    }
  }

  const contaminationDistribution = visualizationData.reduce(
    (acc, item) => {
      const level = item.contamination_level
      acc[level] = (acc[level] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(contaminationDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: getContaminationColor(level),
  }))

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading visualization tools...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Data Visualization</h1>
            <p className="text-gray-600 mt-1">Interactive charts and analysis tools for research data</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Export Charts
          </Button>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Visualization Controls</CardTitle>
            <CardDescription>Configure your data visualization parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Select Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - {project.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Chart Type</label>
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                    <SelectItem value="pie">Distribution Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full bg-transparent">
                  <Eye className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  {chartType === "line" && "HMPI Trend Analysis"}
                  {chartType === "bar" && "HMPI Value Distribution"}
                  {chartType === "scatter" && "pH vs Temperature Correlation"}
                  {chartType === "pie" && "Contamination Level Distribution"}
                </CardTitle>
                <CardDescription>Interactive visualization of water quality data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" && (
                      <LineChart data={visualizationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="hmpi_value" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    )}
                    {chartType === "bar" && (
                      <BarChart data={visualizationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="hmpi_value" fill="#8b5cf6" />
                      </BarChart>
                    )}
                    {chartType === "scatter" && (
                      <ScatterChart data={visualizationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ph" name="pH" />
                        <YAxis dataKey="temperature" name="Temperature" />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter dataKey="temperature" fill="#8b5cf6" />
                      </ScatterChart>
                    )}
                    {chartType === "pie" && (
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Data Summary</CardTitle>
                <CardDescription>Statistical overview of selected dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Samples</div>
                    <div className="text-2xl font-bold text-purple-600">{visualizationData.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Average HMPI</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {visualizationData.length > 0
                        ? (
                            visualizationData.reduce((sum, d) => sum + d.hmpi_value, 0) / visualizationData.length
                          ).toFixed(1)
                        : "0"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Contamination Levels</div>
                    <div className="space-y-2 mt-2">
                      {Object.entries(contaminationDistribution).map(([level, count]) => (
                        <div key={level} className="flex items-center justify-between">
                          <Badge style={{ backgroundColor: getContaminationColor(level), color: "white" }}>
                            {level}
                          </Badge>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
