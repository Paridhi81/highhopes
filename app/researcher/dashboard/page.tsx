"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Users, FileText, Download, Eye } from "lucide-react"

interface ResearchStats {
  total_studies: number
  published_papers: number
  active_collaborations: number
  datasets_available: number
}

interface ResearchProject {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  sample_count: number
  location: string
}

export default function ResearcherDashboard() {
  const [stats, setStats] = useState<ResearchStats>({
    total_studies: 0,
    published_papers: 0,
    active_collaborations: 0,
    datasets_available: 0,
  })
  const [projects, setProjects] = useState<ResearchProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // Fetch projects with sample counts
      const { data: projectsData } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          location,
          created_at,
          water_samples (count)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      if (projectsData) {
        const formattedProjects: ResearchProject[] = projectsData.map((project) => ({
          id: project.id,
          name: project.name,
          description: project.description || "No description available",
          status: "active",
          created_at: project.created_at,
          sample_count: project.water_samples?.[0]?.count || 0,
          location: project.location,
        }))
        setProjects(formattedProjects)

        // Calculate stats
        const totalStudies = projectsData.length
        const publishedPapers = Math.floor(totalStudies * 0.3) // Mock calculation
        const activeCollaborations = Math.floor(totalStudies * 0.6) // Mock calculation
        const datasetsAvailable = projectsData.filter((p) => p.water_samples?.[0]?.count > 0).length

        setStats({
          total_studies: totalStudies,
          published_papers: publishedPapers,
          active_collaborations: activeCollaborations,
          datasets_available: datasetsAvailable,
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading research dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Research Dashboard</h1>
            <p className="text-gray-600 mt-1">Academic research tools and collaborative studies</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <BookOpen className="h-4 w-4 mr-2" />
            New Research Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.total_studies}</div>
                  <p className="text-sm text-gray-600">Total Studies</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.published_papers}</div>
                  <p className="text-sm text-gray-600">Published Papers</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.active_collaborations}</div>
                  <p className="text-sm text-gray-600">Collaborations</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.datasets_available}</div>
                  <p className="text-sm text-gray-600">Datasets Available</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Research Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Active Research Projects</CardTitle>
              <CardDescription>Your current research studies and datasets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{project.location}</span>
                          <span>•</span>
                          <span>{project.sample_count} samples</span>
                          <span>•</span>
                          <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">{project.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Projects
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Research Tools</CardTitle>
              <CardDescription>Access research and analysis tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <TrendingUp className="h-5 w-5 mr-3 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Trend Analysis</div>
                    <div className="text-sm text-gray-600">Analyze water quality trends</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <Eye className="h-5 w-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Data Visualization</div>
                    <div className="text-sm text-gray-600">Create charts and graphs</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <Users className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Collaborative Studies</div>
                    <div className="text-sm text-gray-600">Join research collaborations</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <Download className="h-5 w-5 mr-3 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Export Data</div>
                    <div className="text-sm text-gray-600">Download research datasets</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
