"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface ComplianceData {
  project_name: string
  location: string
  total_samples: number
  compliant_samples: number
  non_compliant_samples: number
  compliance_rate: number
  critical_violations: number
  last_assessment: string
}

export default function CompliancePage() {
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    const supabase = createClient()

    try {
      // Fetch projects with sample and HMPI data
      const { data: projects } = await supabase
        .from("projects")
        .select(
          `
          id,
          name,
          location,
          water_samples (
            id,
            hmpi_calculations (
              hmpi_value,
              contamination_level,
              calculated_at
            )
          )
        `,
        )
        .order("created_at", { ascending: false })

      if (projects) {
        const compliance: ComplianceData[] = projects.map((project) => {
          const samples = project.water_samples || []
          const analyzedSamples = samples.filter((s: any) => s.hmpi_calculations.length > 0)
          const compliantSamples = analyzedSamples.filter((s: any) => s.hmpi_calculations[0]?.hmpi_value <= 100)
          const nonCompliantSamples = analyzedSamples.filter((s: any) => s.hmpi_calculations[0]?.hmpi_value > 100)
          const criticalViolations = analyzedSamples.filter((s: any) => s.hmpi_calculations[0]?.hmpi_value > 300)

          const complianceRate =
            analyzedSamples.length > 0 ? (compliantSamples.length / analyzedSamples.length) * 100 : 0

          const lastAssessment =
            analyzedSamples.length > 0
              ? Math.max(...analyzedSamples.map((s: any) => new Date(s.hmpi_calculations[0]?.calculated_at).getTime()))
              : 0

          return {
            project_name: project.name,
            location: project.location,
            total_samples: analyzedSamples.length,
            compliant_samples: compliantSamples.length,
            non_compliant_samples: nonCompliantSamples.length,
            compliance_rate: complianceRate,
            critical_violations: criticalViolations.length,
            last_assessment: lastAssessment > 0 ? new Date(lastAssessment).toISOString() : "",
          }
        })

        setComplianceData(compliance)
      }
    } catch (error) {
      console.error("Error fetching compliance data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredData =
    selectedRegion === "all"
      ? complianceData
      : complianceData.filter((item) => item.location.toLowerCase().includes(selectedRegion.toLowerCase()))

  const overallStats = {
    totalProjects: filteredData.length,
    totalSamples: filteredData.reduce((sum, item) => sum + item.total_samples, 0),
    compliantSamples: filteredData.reduce((sum, item) => sum + item.compliant_samples, 0),
    nonCompliantSamples: filteredData.reduce((sum, item) => sum + item.non_compliant_samples, 0),
    criticalViolations: filteredData.reduce((sum, item) => sum + item.critical_violations, 0),
  }

  const overallComplianceRate =
    overallStats.totalSamples > 0 ? (overallStats.compliantSamples / overallStats.totalSamples) * 100 : 0

  const generateReport = () => {
    // Generate compliance report
    const reportData = {
      generated_at: new Date().toISOString(),
      region: selectedRegion,
      overall_compliance_rate: overallComplianceRate,
      total_projects: overallStats.totalProjects,
      total_samples: overallStats.totalSamples,
      critical_violations: overallStats.criticalViolations,
      projects: filteredData,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `compliance-report-${selectedRegion}-${new Date().toISOString().split("T")[0]}.json`
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading compliance data...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
            <p className="text-gray-600 mt-1">Regulatory compliance monitoring and assessment</p>
          </div>
          <Button onClick={generateReport} className="bg-blue-600 hover:bg-blue-700">
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
            <CardTitle>Filter Options</CardTitle>
            <CardDescription>Filter compliance data by region or time period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{overallStats.totalProjects}</div>
              <p className="text-sm text-gray-600">Total Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{overallComplianceRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-600">Compliance Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{overallStats.nonCompliantSamples}</div>
              <p className="text-sm text-gray-600">Non-Compliant Sites</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">{overallStats.criticalViolations}</div>
              <p className="text-sm text-gray-600">Critical Violations</p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Project Compliance Status</CardTitle>
            <CardDescription>Detailed compliance assessment for each monitored project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Project</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Samples</th>
                    <th className="text-left p-3">Compliance Rate</th>
                    <th className="text-left p-3">Critical Violations</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Last Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.project_name}</td>
                      <td className="p-3">{item.location}</td>
                      <td className="p-3">{item.total_samples}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Progress value={item.compliance_rate} className="w-16 h-2" />
                          <span className="text-xs">{item.compliance_rate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {item.critical_violations > 0 ? (
                          <Badge variant="destructive">{item.critical_violations}</Badge>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            item.compliance_rate >= 90
                              ? "bg-green-100 text-green-800"
                              : item.compliance_rate >= 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {item.compliance_rate >= 90
                            ? "Compliant"
                            : item.compliance_rate >= 70
                              ? "Warning"
                              : "Non-Compliant"}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {item.last_assessment ? new Date(item.last_assessment).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No compliance data available for the selected region</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
