"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Search,
  Users,
  Database,
  Calculator,
  Microscope,
} from "lucide-react"

interface Resource {
  id: string
  title: string
  type: string
  category: string
  description: string
  url: string
  downloadable: boolean
  tags: string[]
}

export default function ResearcherResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const resources: Resource[] = [
    {
      id: "1",
      title: "WHO Guidelines for Drinking Water Quality",
      type: "Guidelines",
      category: "standards",
      description: "Comprehensive guidelines for water quality standards and heavy metal contamination limits.",
      url: "https://www.who.int/publications/i/item/9789241549950",
      downloadable: true,
      tags: ["WHO", "standards", "heavy metals", "guidelines"],
    },
    {
      id: "2",
      title: "EPA Heavy Metal Analysis Methods",
      type: "Methodology",
      category: "methods",
      description: "Standard methods for heavy metal analysis in water samples using various analytical techniques.",
      url: "https://www.epa.gov/hw-sw846",
      downloadable: true,
      tags: ["EPA", "analysis", "methods", "heavy metals"],
    },
    {
      id: "3",
      title: "HMPI Calculation Framework",
      type: "Tool",
      category: "tools",
      description: "Mathematical framework and calculation methods for Heavy Metal Pollution Index.",
      url: "/resources/hmpi-framework.pdf",
      downloadable: true,
      tags: ["HMPI", "calculation", "framework", "pollution index"],
    },
    {
      id: "4",
      title: "Water Quality Research Database",
      type: "Database",
      category: "databases",
      description: "Global database of water quality research papers and case studies.",
      url: "https://waterresearch.net",
      downloadable: false,
      tags: ["database", "research", "papers", "case studies"],
    },
    {
      id: "5",
      title: "Statistical Analysis Templates",
      type: "Template",
      category: "tools",
      description: "R and Python templates for statistical analysis of water quality data.",
      url: "/resources/statistical-templates.zip",
      downloadable: true,
      tags: ["statistics", "R", "Python", "templates"],
    },
    {
      id: "6",
      title: "International Water Quality Standards",
      type: "Reference",
      category: "standards",
      description: "Comparison of water quality standards across different countries and organizations.",
      url: "/resources/international-standards.pdf",
      downloadable: true,
      tags: ["standards", "international", "comparison", "reference"],
    },
    {
      id: "7",
      title: "Collaborative Research Network",
      type: "Network",
      category: "collaboration",
      description: "Platform for connecting with water quality researchers worldwide.",
      url: "https://waterresearch-network.org",
      downloadable: false,
      tags: ["collaboration", "network", "researchers", "community"],
    },
    {
      id: "8",
      title: "Sample Collection Protocols",
      type: "Protocol",
      category: "methods",
      description: "Standardized protocols for water sample collection and preservation.",
      url: "/resources/collection-protocols.pdf",
      downloadable: true,
      tags: ["protocols", "sampling", "collection", "preservation"],
    },
  ]

  const categories = [
    { id: "all", name: "All Resources", icon: Globe },
    { id: "standards", name: "Standards & Guidelines", icon: FileText },
    { id: "methods", name: "Methods & Protocols", icon: Microscope },
    { id: "tools", name: "Tools & Templates", icon: Calculator },
    { id: "databases", name: "Databases", icon: Database },
    { id: "collaboration", name: "Collaboration", icon: Users },
  ]

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "guidelines":
        return <FileText className="h-4 w-4" />
      case "methodology":
        return <Microscope className="h-4 w-4" />
      case "tool":
        return <Calculator className="h-4 w-4" />
      case "database":
        return <Database className="h-4 w-4" />
      case "template":
        return <FileText className="h-4 w-4" />
      case "reference":
        return <BookOpen className="h-4 w-4" />
      case "network":
        return <Users className="h-4 w-4" />
      case "protocol":
        return <Microscope className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "guidelines":
        return "bg-blue-100 text-blue-800"
      case "methodology":
        return "bg-green-100 text-green-800"
      case "tool":
        return "bg-purple-100 text-purple-800"
      case "database":
        return "bg-orange-100 text-orange-800"
      case "template":
        return "bg-pink-100 text-pink-800"
      case "reference":
        return "bg-indigo-100 text-indigo-800"
      case "network":
        return "bg-teal-100 text-teal-800"
      case "protocol":
        return "bg-cyan-100 text-cyan-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Academic Resources</h1>
            <p className="text-gray-600 mt-1">Research tools, databases, and collaborative platforms</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <BookOpen className="h-4 w-4 mr-2" />
            Request Resource
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resource Library</CardTitle>
            <CardDescription>Search and filter academic resources for water quality research</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search resources, methods, tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(resource.type)}
                    <Badge className={getTypeColor(resource.type)}>{resource.type}</Badge>
                  </div>
                  {resource.downloadable && <Download className="h-4 w-4 text-gray-400" />}
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => window.open(resource.url, "_blank")}
                    >
                      {resource.downloadable ? (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Access
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline">
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredResources.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search terms or category filters</p>
              <Button variant="outline">Clear Filters</Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{resources.length}</div>
              <div className="text-sm text-gray-600">Total Resources</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{resources.filter((r) => r.downloadable).length}</div>
              <div className="text-sm text-gray-600">Downloadable</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{new Set(resources.flatMap((r) => r.tags)).size}</div>
              <div className="text-sm text-gray-600">Topics Covered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{categories.length - 1}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
