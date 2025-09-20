"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface WaterSample {
  id: string
  sample_name: string
  collection_date: string
  project_id: string
  projects: {
    name: string
    location: string
  }
}

interface HeavyMetal {
  id: string
  metal_type: string
  concentration_mg_l: number
  detection_limit: number
}

interface HMPIResult {
  hmpi_value: number
  contamination_level: string
  metal_contributions: { [key: string]: number }
  recommendations: string[]
}

export default function CalculationsPage() {
  const [samples, setSamples] = useState<WaterSample[]>([])
  const [selectedSample, setSelectedSample] = useState("")
  const [heavyMetals, setHeavyMetals] = useState<HeavyMetal[]>([])
  const [hmpiResult, setHmpiResult] = useState<HMPIResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WHO/EPA standards for heavy metals (mg/L)
  const standards = {
    Lead: 0.01,
    Mercury: 0.001,
    Cadmium: 0.003,
    Arsenic: 0.01,
    Chromium: 0.05,
    Copper: 2.0,
    Zinc: 3.0,
    Nickel: 0.07,
  }

  useEffect(() => {
    fetchSamples()
  }, [])

  useEffect(() => {
    if (selectedSample) {
      fetchHeavyMetals(selectedSample)
    }
  }, [selectedSample])

  const fetchSamples = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("water_samples")
      .select(
        `
        id,
        sample_name,
        collection_date,
        project_id,
        projects (
          name,
          location
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching samples:", error)
    } else {
      setSamples(data || [])
    }
  }

  const fetchHeavyMetals = async (sampleId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.from("heavy_metals").select("*").eq("sample_id", sampleId)

    if (error) {
      console.error("Error fetching heavy metals:", error)
    } else {
      setHeavyMetals(data || [])
    }
  }

  const calculateHMPI = async () => {
    if (!selectedSample || heavyMetals.length === 0) return

    setIsCalculating(true)
    setError(null)

    try {
      // Calculate HMPI using the formula
      let totalWeightedConcentration = 0
      let totalWeight = 0
      const metalContributions: { [key: string]: number } = {}

      heavyMetals.forEach((metal) => {
        const standard = standards[metal.metal_type as keyof typeof standards]
        if (standard) {
          const weight = 1 / standard // Inverse of standard as weight
          const weightedConcentration = (metal.concentration_mg_l / standard) * weight
          totalWeightedConcentration += weightedConcentration
          totalWeight += weight
          metalContributions[metal.metal_type] = (metal.concentration_mg_l / standard) * 100
        }
      })

      const hmpiValue = totalWeight > 0 ? totalWeightedConcentration / totalWeight : 0

      // Determine contamination level
      let contaminationLevel = "low"
      if (hmpiValue > 300) contaminationLevel = "very_high"
      else if (hmpiValue > 150) contaminationLevel = "high"
      else if (hmpiValue > 100) contaminationLevel = "moderate"

      // Generate recommendations
      const recommendations = []
      if (hmpiValue > 100) {
        recommendations.push("Immediate water treatment required")
        recommendations.push("Regular monitoring recommended")
      }
      if (metalContributions.Lead > 100) {
        recommendations.push("Lead contamination detected - check plumbing systems")
      }
      if (metalContributions.Mercury > 100) {
        recommendations.push("Mercury contamination - investigate industrial sources")
      }
      if (hmpiValue <= 100) {
        recommendations.push("Water quality within acceptable limits")
        recommendations.push("Continue regular monitoring")
      }

      const result: HMPIResult = {
        hmpi_value: hmpiValue,
        contamination_level: contaminationLevel,
        metal_contributions: metalContributions,
        recommendations,
      }

      setHmpiResult(result)

      // Save calculation to database
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("hmpi_calculations").insert({
          sample_id: selectedSample,
          hmpi_value: hmpiValue,
          contamination_level: contaminationLevel,
          calculated_by: user.id,
        })

        // Create alert if contamination is high
        if (hmpiValue > 150) {
          const sample = samples.find((s) => s.id === selectedSample)
          await supabase.from("alerts").insert({
            project_id: sample?.project_id,
            sample_id: selectedSample,
            alert_type: "contamination",
            severity: hmpiValue > 300 ? "critical" : "high",
            message: `High HMPI value detected: ${hmpiValue.toFixed(2)} in sample ${sample?.sample_name}`,
          })
        }
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during calculation")
    } finally {
      setIsCalculating(false)
    }
  }

  const getContaminationColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "very_high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const selectedSampleData = samples.find((s) => s.id === selectedSample)

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HMPI Calculations</h1>
          <p className="text-gray-600 mt-1">Calculate Heavy Metal Pollution Index for water samples</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sample Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Sample Selection</CardTitle>
                <CardDescription>Choose a water sample for HMPI calculation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Select value={selectedSample} onValueChange={setSelectedSample}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sample" />
                      </SelectTrigger>
                      <SelectContent>
                        {samples.map((sample) => (
                          <SelectItem key={sample.id} value={sample.id}>
                            {sample.sample_name} - {sample.projects?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSampleData && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{selectedSampleData.sample_name}</h4>
                      <p className="text-sm text-gray-600">{selectedSampleData.projects?.name}</p>
                      <p className="text-sm text-gray-600">{selectedSampleData.projects?.location}</p>
                      <p className="text-sm text-gray-500">
                        Collected: {new Date(selectedSampleData.collection_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={calculateHMPI}
                    disabled={!selectedSample || heavyMetals.length === 0 || isCalculating}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    {isCalculating ? "Calculating..." : "Calculate HMPI"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Heavy Metals Data */}
            {heavyMetals.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Heavy Metals Data</CardTitle>
                  <CardDescription>Detected concentrations (mg/L)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {heavyMetals.map((metal) => (
                      <div key={metal.id} className="flex justify-between items-center p-2 border rounded">
                        <span className="font-medium">{metal.metal_type}</span>
                        <span className="text-sm">{metal.concentration_mg_l.toFixed(6)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {hmpiResult ? (
              <div className="space-y-6">
                {/* HMPI Value */}
                <Card>
                  <CardHeader>
                    <CardTitle>HMPI Result</CardTitle>
                    <CardDescription>Heavy Metal Pollution Index calculation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-gray-900 mb-2">{hmpiResult.hmpi_value.toFixed(2)}</div>
                      <Badge className={getContaminationColor(hmpiResult.contamination_level)}>
                        {hmpiResult.contamination_level.replace("_", " ").toUpperCase()} CONTAMINATION
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Classification</div>
                        <div className="font-medium">
                          {hmpiResult.hmpi_value <= 100
                            ? "Acceptable"
                            : hmpiResult.hmpi_value <= 150
                              ? "Moderate Risk"
                              : hmpiResult.hmpi_value > 300
                                ? "Critical Risk"
                                : "High Risk"}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="font-medium">
                          {hmpiResult.hmpi_value <= 100 ? "Safe for Use" : "Treatment Required"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Metal Contributions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Metal Contributions</CardTitle>
                    <CardDescription>Individual metal contribution to pollution index (%)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(hmpiResult.metal_contributions).map(([metal, contribution]) => (
                        <div key={metal}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{metal}</span>
                            <span className="text-sm">{contribution.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(contribution, 100)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>Suggested actions based on HMPI results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {hmpiResult.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-4 h-4 text-teal-500 mt-0.5 mr-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
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
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Calculation Yet</h3>
                  <p className="text-gray-500">Select a sample and click "Calculate HMPI" to see results</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
