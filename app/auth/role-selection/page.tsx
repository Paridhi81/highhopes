import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">HMPI Analyzer</h1>
              <p className="text-sm text-teal-600">Professional Environmental Platform</p>
            </div>
          </div>

          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 mb-4">
            Certified Environmental Analysis Platform
          </Badge>

          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Professional Role</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access specialized tools and features designed for groundwater heavy metal pollution assessment based on
            your professional expertise and requirements.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Scientist */}
          <Card className="relative overflow-hidden border-2 hover:border-teal-300 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl font-semibold">Scientist</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Complete access to data management, advanced calculations, comprehensive analysis tools, and
                professional report generation for research excellence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  Advanced Data Analytics
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  HMPI Calculations
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  Quality Assurance Tools
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  Research Documentation
                </div>
              </div>

              <div className="pt-4">
                <Link href="/auth/login?role=scientist">
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">Enter as Scientist</Button>
                </Link>
                <Link href="/auth/login?role=scientist&demo=true">
                  <Button
                    variant="outline"
                    className="w-full mt-2 text-teal-600 border-teal-200 hover:bg-teal-50 bg-transparent"
                  >
                    Secure Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Policy Maker */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-300 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl font-semibold">Policy Maker</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Strategic access to policy configuration, safety threshold management, comprehensive reporting, and
                regulatory compliance tools for informed decision-making.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Policy Configuration
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Regulatory Thresholds
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Compliance Reports
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Strategic Analytics
                </div>
              </div>

              <div className="pt-4">
                <Link href="/auth/login?role=policy_maker">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Enter as Policy Maker</Button>
                </Link>
                <Link href="/auth/login?role=policy_maker&demo=true">
                  <Button
                    variant="outline"
                    className="w-full mt-2 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                  >
                    Secure Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Researcher */}
          <Card className="relative overflow-hidden border-2 hover:border-purple-300 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl font-semibold">Researcher</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Academic access to visualization tools, published reports, trend analysis, and comparative studies for
                educational and research purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Data Visualization
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Research Access
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Trend Analysis
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  Academic Resources
                </div>
              </div>

              <div className="pt-4">
                <Link href="/auth/login?role=researcher">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Enter as Researcher</Button>
                </Link>
                <Link href="/auth/login?role=researcher&demo=true">
                  <Button
                    variant="outline"
                    className="w-full mt-2 text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                  >
                    Open Access
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            For technical support, please contact{" "}
            <Link href="#" className="text-teal-600 hover:underline">
              administrator
            </Link>
          </p>
          <div className="mt-4 text-xs text-gray-400">
            <p>Other demo accounts:</p>
            <p>Policy Maker: policy@hmpi.com | Researcher: researcher@hmpi.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
