"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"

interface AnalyticsData {
  region: string
  total_projects: number
  compliance_rate: number
  risk_level: string
  population_affected: number
  economic_impact: number
  trend: string
}

export default function StrategicAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [selectedMetric, setSelectedMetric] = useState<string>("compliance")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("90")
  const [isLoading, setIsLoading] = useState(true)
  const [trendData, setTrendData] = useState<any[]>([])
  const [riskDistribution, setRiskDistribution] = useState<any[]>([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeframe])

  const fetchAnalyticsData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - Number.parseInt(selectedTimeframe))

      // Fetch comprehensive data
      const { data: projects } = await supabase
        .from("projects")
        .select(
          `
          id,
          name,
          location,
          water_samples!inner (
            id,
            collected_at,
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

      if (projects) {
        // Process regional analytics
        const regionalData: { [key: string]: any } = {}

        projects.forEach((project) => {
          const region = project.location.split(",")[0] || "Unknown"
          const samples = project.water_samples || []
          const analyzedSamples = samples.filter((s: any) => s.hmpi_calculations.length > 0)
          const compliantSamples = analyzedSamples.filter((s: any) => s.hmpi_calculations[0]?.hmpi_value <= 100)

          if (!regionalData[region]) {
            regionalData[region] = {
              region,
              projects: [],
              total_samples: 0,
              compliant_samples: 0,
              high_risk_samples: 0,
            }
          }

          regionalData[region].projects.push(project)
          regionalData[region].total_samples += analyzedSamples.length
          regionalData[region].compliant_samples += compliantSamples.length
          regionalData[region].high_risk_samples += analyzedSamples.filter(
            (s: any) => s.hmpi_calculations[0]?.hmpi_value > 200,
          ).length
        })

        // Convert to analytics format
        const analytics: AnalyticsData[] = Object.values(regionalData).map((region: any) => {
          const complianceRate = region.total_samples > 0 ? (region.compliant_samples / region.total_samples) * 100 : 0

          const riskLevel = complianceRate >= 80 ? "Low" : complianceRate >= 60 ? "Medium" : "High"

          // Estimate population affected (mock calculation)
          const populationAffected = region.projects.length * 50000 // Assume 50k people per project area

          // Estimate economic impact (mock calculation)
          const economicImpact = region.high_risk_samples * 100000 // $100k per high-risk site

          return {
            region: region.region,
            total_projects: region.projects.length,
            compliance_rate: complianceRate,
            risk_level: riskLevel,
            population_affected: populationAffected,
            economic_impact: economicImpact,
            trend: complianceRate >= 75 ? "improving" : complianceRate >= 50 ? "stable" : "declining",
          }
        })

        setAnalyticsData(analytics)

        // Generate trend data for time series
        const trendChartData = []
        for (
          let i = Number.parseInt(selectedTimeframe);
          i >= 0;
          i -= Math.ceil(Number.parseInt(selectedTimeframe) / 12)
        ) {
          const date = new Date()
          date.setDate(date.getDate() - i)

          const dayProjects = projects.filter((p) =>
            p.water_samples.some((s: any) => {
              const sampleDate = new Date(s.collected_at)
              return sampleDate.toDateString() === date.toDateString()
            }),
          )

          if (dayProjects.length > 0) {
            const dayCompliance =
              dayProjects.reduce((acc, p) => {
                const samples = p.water_samples.filter((s: any) => s.hmpi_calculations.length > 0)
                const compliant = samples.filter((s: any) => s.hmpi_calculations[0]?.hmpi_value <= 100)
                return acc + (samples.length > 0 ? (compliant.length / samples.length) * 100 : 0)
              }, 0) / dayProjects.length

            trendChartData.push({
              date: date.toLocaleDateString(),
              compliance: dayCompliance,
              projects: dayProjects.length,
            })
          }
        }

        setTrendData(trendChartData)

        // Risk distribution
        const riskDist = [
          { name: "Low Risk", value: analytics.filter((a) => a.risk_level === "Low").length, color: "#10b981" },
          { name: "Medium Risk", value: analytics.filter((a) => a.risk_level === "Medium").length, color: "#f59e0b" },
          { name: "High Risk", value: analytics.filter((a) => a.risk_level === "High").length, color: "#ef4444" },
        ]

        setRiskDistribution(riskDist)
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPopulation = analyticsData.reduce((sum, a) => sum + a.population_affected, 0)
  const totalEconomicImpact = analyticsData.reduce((sum, a) => sum + a.economic_impact, 0)
  const averageCompliance =
    analyticsData.length > 0 ? analyticsData.reduce((sum, a) => sum + a.compliance_rate, 0) / analyticsData.length : 0

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating strategic analytics...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Strategic Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive policy insights and regional impact analysis</p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analysis Configuration</CardTitle>
            <CardDescription>Configure parameters for strategic analysis</CardDescription>
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
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Primary Metric</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliance">Compliance Rate</SelectItem>
                    <SelectItem value="population">Population Impact</SelectItem>
                    <SelectItem value="economic">Economic Impact</SelectItem>
                    <SelectItem value="risk">Risk Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{averageCompliance.toFixed(1)}%</div>
              <p className="text-sm text-gray-600">Average Compliance</p>
              <div className="mt-2">
                <Progress value={averageCompliance} className="h-2" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{analyticsData.length}</div>
              <p className="text-sm text-gray-600">Regions Monitored</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">{(totalPopulation / 1000000).toFixed(1)}M</div>
              <p className="text-sm text-gray-600">Population Affected</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">${(totalEconomicImpact / 1000000).toFixed(1)}M</div>
              <p className="text-sm text-gray-600">Economic Impact</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Compliance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trend Analysis</CardTitle>
              <CardDescription>Regional compliance rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="compliance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Risk Assessment</CardTitle>
              <CardDescription>Distribution of risk levels across regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {riskDistribution.map((entry, index) => (
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

        {/* Regional Impact Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Regional Impact Matrix</CardTitle>
            <CardDescription>Comprehensive analysis of policy impact across regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Region</th>
                    <th className="text-left p-3">Projects</th>
                    <th className="text-left p-3">Compliance Rate</th>
                    <th className="text-left p-3">Risk Level</th>
                    <th className="text-left p-3">Population Impact</th>
                    <th className="text-left p-3">Economic Impact</th>
                    <th className="text-left p-3">Trend</th>
                    <th className="text-left p-3">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData
                    .sort((a, b) => a.compliance_rate - b.compliance_rate)
                    .map((region, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{region.region}</td>
                        <td className="p-3">{region.total_projects}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Progress value={region.compliance_rate} className="w-16 h-2" />
                            <span className="text-xs">{region.compliance_rate.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              region.risk_level === "Low"
                                ? "bg-green-100 text-green-800"
                                : region.risk_level === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {region.risk_level}
                          </Badge>
                        </td>
                        <td className="p-3">{(region.population_affected / 1000).toFixed(0)}K</td>
                        <td className="p-3">${(region.economic_impact / 1000000).toFixed(1)}M</td>
                        <td className="p-3">
                          <Badge
                            className={
                              region.trend === "improving"
                                ? "bg-green-100 text-green-800"
                                : region.trend === "stable"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {region.trend}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              region.compliance_rate < 50
                                ? "bg-red-100 text-red-800"
                                : region.compliance_rate < 75
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                            }
                          >
                            {region.compliance_rate < 50 ? "Critical" : region.compliance_rate < 75 ? "High" : "Normal"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Policy Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Strategic Recommendations</CardTitle>
            <CardDescription>Data-driven policy recommendations based on current analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Immediate Actions Required</h4>
                <div className="space-y-3">
                  {analyticsData
                    .filter((a) => a.risk_level === "High")
                    .slice(0, 3)
                    .map((region, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-900">{region.region}</span>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          Compliance rate: {region.compliance_rate.toFixed(1)}% - Immediate intervention required
                        </p>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Strategic Opportunities</h4>
                <div className="space-y-3">
                  {analyticsData
                    .filter((a) => a.trend === "improving")
                    .slice(0, 3)
                    .map((region, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-900">{region.region}</span>
                          <Badge className="bg-green-100 text-green-800">Improving</Badge>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Positive trend - Consider expanding successful policies
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
