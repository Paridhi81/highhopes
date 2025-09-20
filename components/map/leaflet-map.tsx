"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface MapProps {
  samples: any[]
  selectedProject?: string
  onProjectChange?: (projectId: string) => void
  projects?: any[]
}

export function LeafletMap({ samples, selectedProject, onProjectChange, projects = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        // Fix for default markers in Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        if (mapRef.current && !mapInstanceRef.current) {
          // Initialize map
          mapInstanceRef.current = L.map(mapRef.current).setView([19.076, 72.8777], 10)

          // Add tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(mapInstanceRef.current)

          setIsLoading(false)
        }

        // Update markers when samples change
        if (mapInstanceRef.current) {
          updateMarkers(L)
        }
      })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && mapInstanceRef.current) {
      import("leaflet").then((L) => {
        updateMarkers(L)
      })
    }
  }, [samples, selectedProject])

  const updateMarkers = (L: any) => {
    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Filter samples based on selected project
    const filteredSamples = selectedProject
      ? samples.filter((sample) => sample.project_id === selectedProject)
      : samples

    // Add new markers
    filteredSamples.forEach((sample) => {
      if (sample.latitude && sample.longitude) {
        // Determine marker color based on contamination level
        const getMarkerColor = (sample: any) => {
          if (sample.hmpi_calculations && sample.hmpi_calculations.length > 0) {
            const hmpi = sample.hmpi_calculations[0].hmpi_value
            if (hmpi > 300) return "#dc2626" // red
            if (hmpi > 150) return "#ea580c" // orange
            if (hmpi > 100) return "#ca8a04" // yellow
            return "#16a34a" // green
          }
          return "#6b7280" // gray for no data
        }

        // Create custom icon
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              background-color: ${getMarkerColor(sample)};
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })

        const marker = L.marker([sample.latitude, sample.longitude], { icon: customIcon }).addTo(mapInstanceRef.current)

        // Create popup content
        const hmpiData = sample.hmpi_calculations?.[0]
        const contaminationLevel = hmpiData?.contamination_level || "unknown"
        const hmpiValue = hmpiData?.hmpi_value || "N/A"

        const popupContent = `
          <div style="min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${sample.sample_name}</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${sample.projects?.name || "Unknown Project"}</p>
            </div>
            
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 12px; color: #6b7280;">HMPI Value:</span>
                <span style="font-size: 12px; font-weight: 600; color: #111827;">${typeof hmpiValue === "number" ? hmpiValue.toFixed(2) : hmpiValue}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 12px; color: #6b7280;">Status:</span>
                <span style="
                  font-size: 10px; 
                  padding: 2px 6px; 
                  border-radius: 4px; 
                  font-weight: 500;
                  background-color: ${contaminationLevel === "low" ? "#dcfce7" : contaminationLevel === "moderate" ? "#fef3c7" : contaminationLevel === "high" ? "#fed7aa" : contaminationLevel === "very_high" ? "#fecaca" : "#f3f4f6"};
                  color: ${contaminationLevel === "low" ? "#166534" : contaminationLevel === "moderate" ? "#92400e" : contaminationLevel === "high" ? "#c2410c" : contaminationLevel === "very_high" ? "#dc2626" : "#6b7280"};
                ">${contaminationLevel.replace("_", " ").toUpperCase()}</span>
              </div>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-size: 11px; color: #6b7280;">pH Level:</span>
                <span style="font-size: 11px; color: #111827;">${sample.ph_level || "N/A"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-size: 11px; color: #6b7280;">Temperature:</span>
                <span style="font-size: 11px; color: #111827;">${sample.temperature_celsius ? sample.temperature_celsius + "°C" : "N/A"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-size: 11px; color: #6b7280;">Depth:</span>
                <span style="font-size: 11px; color: #111827;">${sample.depth_meters ? sample.depth_meters + "m" : "N/A"}</span>
              </div>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span style="font-size: 10px; color: #6b7280;">Collected:</span>
                <span style="font-size: 10px; color: #6b7280;">${new Date(sample.collection_date).toLocaleDateString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="font-size: 10px; color: #6b7280;">Coordinates:</span>
                <span style="font-size: 10px; color: #6b7280;">${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>
        `

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: "custom-popup",
        })

        markersRef.current.push(marker)
      }
    })

    // Fit map to markers if there are any
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Project Selection</CardTitle>
          <CardDescription>Choose a project to visualize its sample locations on the map</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedProject || "all"} onValueChange={onProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project to view on map" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (mapInstanceRef.current && markersRef.current.length > 0) {
                  const L = require("leaflet")
                  const group = new L.featureGroup(markersRef.current)
                  mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
                }
              }}
            >
              Fit to View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Locations Map</CardTitle>
          <CardDescription>
            Interactive map showing water sample collection points with contamination levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Contamination Levels:</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-xs text-gray-600">Low (≤100)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-xs text-gray-600">Moderate (100-150)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-xs text-gray-600">High (150-300)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-xs text-gray-600">Very High &gt;300</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full border-2 border-white shadow"></div>
                <span className="text-xs text-gray-600">No Data</span>
              </div>
            </div>

            {/* Map Container */}
            <div className="relative">
              <div
                ref={mapRef}
                className="w-full h-96 rounded-lg border border-gray-200"
                style={{ minHeight: "400px" }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sample Count */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Showing{" "}
                {selectedProject ? samples.filter((s) => s.project_id === selectedProject).length : samples.length}{" "}
                sample locations
              </span>
              <span>Click on markers for detailed information</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Leaflet CSS */}
      <style jsx global>{`
        @import url("https://unpkg.com/leaflet@1.7.1/dist/leaflet.css");
        
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 12px;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  )
}
