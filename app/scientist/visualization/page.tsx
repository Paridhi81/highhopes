"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LeafletMap } from "@/components/map/leaflet-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Project {
  id: string
  name: string
  location: string
  status: string
}

interface WaterSample {
  id: string
  sample_name: string
  collection_date: string
  latitude: number
  longitude: number
  ph_level: number
  temperature_celsius: number
  depth_meters: number
  project_id: string
  projects: {
    name: string
    location: string
  }
  hmpi_calculations: Array<{
    hmpi_value: number
    contamination_level: string
  }>
}

export default function VisualizationPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [samples, setSamples] = useState<WaterSample[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      // Fetch samples with project info and HMPI calculations
      const { data: samplesData } = await supabase
        .from("water_samples")
        .select(
          `
          *,
          projects (
            name,
            location
          ),
          hmpi_calculations (
            hmpi_value,
            contamination_level
          )
        `,
        )
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false })

      setProjects(projectsData || [])
      setSamples(samplesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
  }

  // Calculate statistics
  const filteredSamples = selectedProject ? samples.filter((s) => s.project_id === selectedProject) : samples
  const totalSamples = filteredSamples.length
  const samplesWithHMPI = filteredSamples.filter((s) => s.hmpi_calculations.length > 0)
  const contaminatedSamples = samplesWithHMPI.filter((s) => s.hmpi_calculations[0]?.hmpi_value > 100)
  const highRiskSamples = samplesWithHMPI.filter((s) => s.hmpi_calculations[0]?.hmpi_value > 150)

  const selectedProjectData = projects.find((p) => p.id === selectedProject)

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading visualization data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GIS Visualization</h1>
          <p className="text-gray-600 mt-1">
            Interactive map visualization of water sample locations and contamination levels
          </p>
        </div>

        {/* Project Info */}
        {selectedProjectData && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedProjectData.name}</CardTitle>
                  <CardDescription>{selectedProjectData.location}</CardDescription>
                </div>
                <Badge
                  className={
                    selectedProjectData.status === "active"
                      ? "bg-green-100 text-green-800"
                      : selectedProjectData.status === "completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {selectedProjectData.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{totalSamples}</div>
              <p className="text-sm text-gray-600">Total Samples</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{samplesWithHMPI.length}</div>
              <p className="text-sm text-gray-600">Analyzed Samples</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{contaminatedSamples.length}</div>
              <p className="text-sm text-gray-600">Contaminated Sites</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{highRiskSamples.length}</div>
              <p className="text-sm text-gray-600">High Risk Sites</p>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <LeafletMap
          samples={samples}
          selectedProject={selectedProject}
          onProjectChange={handleProjectChange}
          projects={projects}
        />

        {/* Sample List */}
        {filteredSamples.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Sample Details</CardTitle>
              <CardDescription>
                {selectedProject ? `Samples from ${selectedProjectData?.name}` : "All samples with location data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Sample Name</th>
                      <th className="text-left p-2">Project</th>
                      <th className="text-left p-2">Collection Date</th>
                      <th className="text-left p-2">HMPI Value</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Coordinates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSamples.slice(0, 10).map((sample) => {
                      const hmpi = sample.hmpi_calculations[0]
                      return (
                        <tr key={sample.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{sample.sample_name}</td>
                          <td className="p-2">{sample.projects.name}</td>
                          <td className="p-2">{new Date(sample.collection_date).toLocaleDateString()}</td>
                          <td className="p-2">{hmpi ? hmpi.hmpi_value.toFixed(2) : "N/A"}</td>
                          <td className="p-2">
                            {hmpi ? (
                              <Badge
                                className={
                                  hmpi.contamination_level === "low"
                                    ? "bg-green-100 text-green-800"
                                    : hmpi.contamination_level === "moderate"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : hmpi.contamination_level === "high"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                }
                              >
                                {hmpi.contamination_level}
                              </Badge>
                            ) : (
                              <Badge variant="outline">No Data</Badge>
                            )}
                          </td>
                          <td className="p-2 text-xs text-gray-500">
                            {sample.latitude.toFixed(4)}, {sample.longitude.toFixed(4)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredSamples.length > 10 && (
                  <div className="text-center p-4 text-sm text-gray-500">
                    Showing first 10 of {filteredSamples.length} samples
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {samples.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Data Available</h3>
              <p className="text-gray-500">Add GPS coordinates to your water samples to see them on the map</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
