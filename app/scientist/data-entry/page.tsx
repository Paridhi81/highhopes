"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  location: string
  status: string
}

interface HeavyMetal {
  metal_type: string
  concentration_mg_l: number
  detection_limit: number
  analysis_method: string
}

export default function DataEntryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Sample form data
  const [sampleData, setSampleData] = useState({
    sample_name: "",
    collection_date: "",
    collection_time: "",
    latitude: "",
    longitude: "",
    depth_meters: "",
    temperature_celsius: "",
    ph_level: "",
    dissolved_oxygen: "",
    turbidity: "",
    conductivity: "",
  })

  // Heavy metals data
  const [heavyMetals, setHeavyMetals] = useState<HeavyMetal[]>([
    { metal_type: "Lead", concentration_mg_l: 0, detection_limit: 0.001, analysis_method: "ICP-MS" },
    { metal_type: "Mercury", concentration_mg_l: 0, detection_limit: 0.0001, analysis_method: "ICP-MS" },
    { metal_type: "Cadmium", concentration_mg_l: 0, detection_limit: 0.0005, analysis_method: "ICP-MS" },
    { metal_type: "Arsenic", concentration_mg_l: 0, detection_limit: 0.001, analysis_method: "ICP-MS" },
    { metal_type: "Chromium", concentration_mg_l: 0, detection_limit: 0.001, analysis_method: "ICP-MS" },
    { metal_type: "Copper", concentration_mg_l: 0, detection_limit: 0.001, analysis_method: "ICP-MS" },
    { metal_type: "Zinc", concentration_mg_l: 0, detection_limit: 0.001, analysis_method: "ICP-MS" },
    { metal_type: "Nickel", concentration_mg_l: 0, detection_limit: 0.001, analysis_method: "ICP-MS" },
  ])

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
    } else {
      setProjects(data || [])
    }
  }

  const handleSampleDataChange = (field: string, value: string) => {
    setSampleData((prev) => ({ ...prev, [field]: value }))
  }

  const handleHeavyMetalChange = (index: number, field: keyof HeavyMetal, value: string | number) => {
    setHeavyMetals((prev) =>
      prev.map((metal, i) =>
        i === index ? { ...metal, [field]: field === "metal_type" ? value : Number(value) } : metal,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Insert water sample
      const { data: sampleResult, error: sampleError } = await supabase
        .from("water_samples")
        .insert({
          project_id: selectedProject,
          sample_name: sampleData.sample_name,
          collection_date: sampleData.collection_date,
          collection_time: sampleData.collection_time || null,
          latitude: sampleData.latitude ? Number.parseFloat(sampleData.latitude) : null,
          longitude: sampleData.longitude ? Number.parseFloat(sampleData.longitude) : null,
          depth_meters: sampleData.depth_meters ? Number.parseFloat(sampleData.depth_meters) : null,
          temperature_celsius: sampleData.temperature_celsius
            ? Number.parseFloat(sampleData.temperature_celsius)
            : null,
          ph_level: sampleData.ph_level ? Number.parseFloat(sampleData.ph_level) : null,
          dissolved_oxygen: sampleData.dissolved_oxygen ? Number.parseFloat(sampleData.dissolved_oxygen) : null,
          turbidity: sampleData.turbidity ? Number.parseFloat(sampleData.turbidity) : null,
          conductivity: sampleData.conductivity ? Number.parseFloat(sampleData.conductivity) : null,
          created_by: user.id,
        })
        .select()
        .single()

      if (sampleError) throw sampleError

      // Insert heavy metals data
      const heavyMetalsData = heavyMetals
        .filter((metal) => metal.concentration_mg_l > 0)
        .map((metal) => ({
          sample_id: sampleResult.id,
          metal_type: metal.metal_type,
          concentration_mg_l: metal.concentration_mg_l,
          detection_limit: metal.detection_limit,
          analysis_method: metal.analysis_method,
          analysis_date: sampleData.collection_date,
        }))

      if (heavyMetalsData.length > 0) {
        const { error: metalsError } = await supabase.from("heavy_metals").insert(heavyMetalsData)
        if (metalsError) throw metalsError
      }

      setSuccess("Sample data and heavy metals analysis saved successfully!")

      // Reset form
      setSampleData({
        sample_name: "",
        collection_date: "",
        collection_time: "",
        latitude: "",
        longitude: "",
        depth_meters: "",
        temperature_celsius: "",
        ph_level: "",
        dissolved_oxygen: "",
        turbidity: "",
        conductivity: "",
      })
      setHeavyMetals((prev) => prev.map((metal) => ({ ...metal, concentration_mg_l: 0 })))
      setSelectedProject("")

      // Redirect to calculations page after 2 seconds
      setTimeout(() => {
        router.push("/scientist/calculations")
      }, 2000)
    } catch (error: any) {
      setError(error.message || "An error occurred while saving the data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Entry</h1>
          <p className="text-gray-600 mt-1">Enter water sample data and heavy metal concentrations for analysis</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Project Selection</CardTitle>
              <CardDescription>Select the project this sample belongs to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
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
              </div>
            </CardContent>
          </Card>

          {/* Sample Information */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Information</CardTitle>
              <CardDescription>Basic information about the water sample</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sample_name">Sample Name</Label>
                  <Input
                    id="sample_name"
                    value={sampleData.sample_name}
                    onChange={(e) => handleSampleDataChange("sample_name", e.target.value)}
                    placeholder="e.g., WS-001-2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="collection_date">Collection Date</Label>
                  <Input
                    id="collection_date"
                    type="date"
                    value={sampleData.collection_date}
                    onChange={(e) => handleSampleDataChange("collection_date", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="collection_time">Collection Time</Label>
                  <Input
                    id="collection_time"
                    type="time"
                    value={sampleData.collection_time}
                    onChange={(e) => handleSampleDataChange("collection_time", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="depth_meters">Depth (meters)</Label>
                  <Input
                    id="depth_meters"
                    type="number"
                    step="0.01"
                    value={sampleData.depth_meters}
                    onChange={(e) => handleSampleDataChange("depth_meters", e.target.value)}
                    placeholder="e.g., 15.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Data */}
          <Card>
            <CardHeader>
              <CardTitle>Location Data</CardTitle>
              <CardDescription>GPS coordinates of the sampling location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={sampleData.latitude}
                    onChange={(e) => handleSampleDataChange("latitude", e.target.value)}
                    placeholder="e.g., 19.0760"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={sampleData.longitude}
                    onChange={(e) => handleSampleDataChange("longitude", e.target.value)}
                    placeholder="e.g., 72.8777"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Physical Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>Physical & Chemical Parameters</CardTitle>
              <CardDescription>Basic water quality parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="temperature_celsius">Temperature (°C)</Label>
                  <Input
                    id="temperature_celsius"
                    type="number"
                    step="0.1"
                    value={sampleData.temperature_celsius}
                    onChange={(e) => handleSampleDataChange("temperature_celsius", e.target.value)}
                    placeholder="e.g., 25.5"
                  />
                </div>
                <div>
                  <Label htmlFor="ph_level">pH Level</Label>
                  <Input
                    id="ph_level"
                    type="number"
                    step="0.01"
                    value={sampleData.ph_level}
                    onChange={(e) => handleSampleDataChange("ph_level", e.target.value)}
                    placeholder="e.g., 7.2"
                  />
                </div>
                <div>
                  <Label htmlFor="dissolved_oxygen">Dissolved Oxygen (mg/L)</Label>
                  <Input
                    id="dissolved_oxygen"
                    type="number"
                    step="0.01"
                    value={sampleData.dissolved_oxygen}
                    onChange={(e) => handleSampleDataChange("dissolved_oxygen", e.target.value)}
                    placeholder="e.g., 8.5"
                  />
                </div>
                <div>
                  <Label htmlFor="turbidity">Turbidity (NTU)</Label>
                  <Input
                    id="turbidity"
                    type="number"
                    step="0.01"
                    value={sampleData.turbidity}
                    onChange={(e) => handleSampleDataChange("turbidity", e.target.value)}
                    placeholder="e.g., 2.1"
                  />
                </div>
                <div>
                  <Label htmlFor="conductivity">Conductivity (μS/cm)</Label>
                  <Input
                    id="conductivity"
                    type="number"
                    step="0.01"
                    value={sampleData.conductivity}
                    onChange={(e) => handleSampleDataChange("conductivity", e.target.value)}
                    placeholder="e.g., 450"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Heavy Metals Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Heavy Metals Analysis</CardTitle>
              <CardDescription>Enter concentration values for heavy metals (mg/L)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {heavyMetals.map((metal, index) => (
                  <div key={metal.metal_type} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{metal.metal_type}</h4>
                      <Badge variant="outline" className="text-xs">
                        {metal.analysis_method}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`concentration_${index}`}>Concentration (mg/L)</Label>
                        <Input
                          id={`concentration_${index}`}
                          type="number"
                          step="0.000001"
                          value={metal.concentration_mg_l}
                          onChange={(e) => handleHeavyMetalChange(index, "concentration_mg_l", e.target.value)}
                          placeholder="0.000000"
                        />
                      </div>
                      <div className="text-xs text-gray-500">Detection limit: {metal.detection_limit} mg/L</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedProject} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? "Saving..." : "Save Sample Data"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
