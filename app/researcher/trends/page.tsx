"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Download, Calendar } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

interface TrendData {
  period: string
  hmpi_avg: number
  sample_count: number
  contamination_trend: string
  ph_avg: number
  temperature_avg: number
}

interface RegionalTrend {
  region: string
  trend_direction: string
  change_percentage: number
  current_hmpi: number
  previous_hmpi: number
}

export default function ResearcherTrendsPage() {
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [regionalTrends, setRegionalTrends] = useState<RegionalTrend[]>([])
  const [timeframe, setTimeframe] = useState<string>("6months")
  const [selectedMetric, setSelectedMetric] = useState<string>("hmpi")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTrendData()
  }, [timeframe])

  const fetchTrendData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()

      switch (timeframe) {
        case "3months":
          startDate.setMonth(endDate.getMonth() - 3)
          break
        case "6months":
          startDate.setMonth(endDate.getMonth() - 6)
          break
        case "1year":
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
        case "2years":
          startDate.setFullYear(endDate.getFullYear() - 2)
          break
      }

      // Fetch water samples with calculations
      const { data: samples } = await supabase
        .from("water_samples")
        .select(`
          collected_at,
          ph,
          temperature,
          location,
          projects (location),
          hmpi_calculations (
            hmpi_value,
            contamination_level
          )
        `)
        .gte("collected_at", startDate.toISOString())
        .lte("collected_at", endDate.toISOString())
        .order("collected_at", { ascending: true })

      if (samples) {
        // Process trend data by month
        const monthlyData: { [key: string]: any } = {}
        const regionalData: { [key: string]: any } = {}

        samples.forEach((sample) => {
          if (sample.hmpi_calculations.length === 0) return

          const date = new Date(sample.collected_at)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          const region = sample.projects?.location?.split(",")[0] || sample.location?.split(",")[0] || "Unknown"

          // Monthly aggregation
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              period: monthKey,
              hmpi_values: [],
              ph_values: [],
              temp_values: [],
              sample_count: 0,
            }
          }

          monthlyData[monthKey].hmpi_values.push(sample.hmpi_calculations[0].hmpi_value)
          monthlyData[monthKey].ph_values.push(sample.ph)
          monthlyData[monthKey].temp_values.push(sample.temperature)
          monthlyData[monthKey].sample_count++

          // Regional aggregation
          if (!regionalData[region]) {
            regionalData[region] = {
              region,
              hmpi_values: [],
              recent_values: [],
              older_values: [],
            }
          }

          regionalData[region].hmpi_values.push(sample.hmpi_calculations[0].hmpi_value)

          // Split into recent vs older for trend calculation
          const isRecent = date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 3 months
          if (isRecent) {
            regionalData[region].recent_values.push(sample.hmpi_calculations[0].hmpi_value)
          } else {
            regionalData[region].older_values.push(sample.hmpi_calculations[0].hmpi_value)
          }
        })

        // Format trend data
        const formattedTrendData: TrendData[] = Object.values(monthlyData).map((month: any) => {
          const hmpi_avg =
            month.hmpi_values.reduce((sum: number, val: number) => sum + val, 0) / month.hmpi_values.length
          const ph_avg = month.ph_values.reduce((sum: number, val: number) => sum + val, 0) / month.ph_values.length
          const temperature_avg =
            month.temp_values.reduce((sum: number, val: number) => sum + val, 0) / month.temp_values.length

          return {
            period: new Date(month.period + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            hmpi_avg: Number(hmpi_avg.toFixed(1)),
            sample_count: month.sample_count,
            contamination_trend: hmpi_avg > 100 ? "increasing" : hmpi_avg > 50 ? "stable" : "decreasing",
            ph_avg: Number(ph_avg.toFixed(1)),
            temperature_avg: Number(temperature_avg.toFixed(1)),
          }
        })

        // Format regional trends
        const formattedRegionalTrends: RegionalTrend[] = Object.values(regionalData)
          .filter((region: any) => region.recent_values.length > 0 && region.older_values.length > 0)
          .map((region: any) => {
            const recentAvg =
              region.recent_values.reduce((sum: number, val: number) => sum + val, 0) / region.recent_values.length
            const olderAvg =
              region.older_values.reduce((sum: number, val: number) => sum + val, 0) / region.older_values.length
            const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100

            return {
              region: region.region,
              trend_direction: changePercentage > 5 ? "increasing" : changePercentage < -5 ? "decreasing" : "stable",
              change_percentage: Number(changePercentage.toFixed(1)),
              current_hmpi: Number(recentAvg.toFixed(1)),
              previous_hmpi: Number(olderAvg.toFixed(1)),
            }
          })

        setTrendData(formattedTrendData)
        setRegionalTrends(formattedRegionalTrends)
      }
    } catch (error) {
      console.error("Error fetching trend data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case "increasing":
        return "bg-red-100 text-red-800"
      case "decreasing":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
            <p className="text-gray-600 mt-1">Long-term water quality trends and patterns</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analysis Parameters</CardTitle>
            <CardDescription>Configure trend analysis settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">Last 3 months</SelectItem>
                    <SelectItem value="6months">Last 6 months</SelectItem>
                    <SelectItem value="1year">Last year</SelectItem>
                    <SelectItem value="2years">Last 2 years</SelectItem>
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
                    <SelectItem value="hmpi">HMPI Values</SelectItem>
                    <SelectItem value="ph">pH Levels</SelectItem>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="samples">Sample Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Custom Range
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Temporal Trend Analysis</CardTitle>
            <CardDescription>
              {selectedMetric === "hmpi" && "Heavy Metal Pollution Index trends over time"}
              {selectedMetric === "ph" && "pH level variations over time"}
              {selectedMetric === "temperature" && "Temperature changes over time"}
              {selectedMetric === "samples" && "Sample collection frequency over time"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey={
                      selectedMetric === "hmpi"
                        ? "hmpi_avg"
                        : selectedMetric === "ph"
                          ? "ph_avg"
                          : selectedMetric === "temperature"
                            ? "temperature_avg"
                            : "sample_count"
                    }
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Regional Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Trend Summary</CardTitle>
            <CardDescription>Contamination trends across different regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Region</th>
                    <th className="text-left p-3">Trend</th>
                    <th className="text-left p-3">Change</th>
                    <th className="text-left p-3">Current HMPI</th>
                    <th className="text-left p-3">Previous HMPI</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalTrends.map((trend, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{trend.region}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(trend.trend_direction)}
                          <span className="capitalize">{trend.trend_direction}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            trend.change_percentage > 0
                              ? "text-red-600"
                              : trend.change_percentage < 0
                                ? "text-green-600"
                                : "text-gray-600"
                          }
                        >
                          {trend.change_percentage > 0 ? "+" : ""}
                          {trend.change_percentage}%
                        </span>
                      </td>
                      <td className="p-3 font-medium">{trend.current_hmpi}</td>
                      <td className="p-3 text-gray-600">{trend.previous_hmpi}</td>
                      <td className="p-3">
                        <Badge className={getTrendColor(trend.trend_direction)}>
                          {trend.current_hmpi > 100 ? "Critical" : trend.current_hmpi > 50 ? "Moderate" : "Safe"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
